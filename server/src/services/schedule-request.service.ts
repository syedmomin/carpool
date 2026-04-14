import prisma from '../data-source';
import { AppError } from '../utils/AppError';
import { notify, notifyMany } from '../utils/notificationDispatcher';

const DRIVER_INCLUDE = {
  select: {
    id: true, name: true, avatar: true, phone: true,
    reviewsReceived: { select: { rating: true } },
  },
};

const VEHICLE_INCLUDE = {
  select: {
    id: true, brand: true, model: true, type: true, color: true,
    plateNumber: true, totalSeats: true, images: true,
    ac: true, wifi: true, music: true, usbCharging: true,
    waterCooler: true, blanket: true, firstAid: true, luggageRack: true,
  },
};

const PASSENGER_INCLUDE = {
  select: { id: true, name: true, avatar: true, phone: true },
};

function withDriverRating(bid: any): any {
  if (!bid?.driver) return bid;
  const reviews: { rating: number }[] = bid.driver.reviewsReceived || [];
  const avg = reviews.length
    ? Math.round((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;
  const { reviewsReceived, ...driverRest } = bid.driver;
  return { ...bid, driver: { ...driverRest, rating: avg, reviewCount: reviews.length } };
}

// ─────────────────────────────────────────────────────────────────────────────

export class ScheduleRequestService {

  // ── Passenger: create a new schedule request ─────────────────────────────
  async createRequest(passengerId: string, data: {
    fromCity: string; toCity: string; date: string; departureTime?: string; seats: number; note?: string;
  }) {
    if (data.fromCity.toLowerCase() === data.toCity.toLowerCase())
      throw AppError.badRequest('From and To cities cannot be the same');

    const today = new Date().toISOString().split('T')[0];
    if (data.date < today)
      throw AppError.badRequest('Date cannot be in the past');

    if (data.departureTime) {
      const timeReg = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeReg.test(data.departureTime))
        throw AppError.badRequest('Departure time must be in HH:MM format');
    }

    const request = await prisma.scheduleRequest.create({
      data: {
        passengerId,
        fromCity:      data.fromCity,
        toCity:        data.toCity,
        date:          data.date,
        departureTime: data.departureTime || '00:00',
        seats:         data.seats || 1,
        note:          data.note,
        createdBy: passengerId,
        updatedBy: passengerId,
      },
      include: { passenger: PASSENGER_INCLUDE },
    });

    // Broadcast to all drivers via socket
    try {
      const { broadcastEvent } = await import('../socket');
      broadcastEvent('SCHEDULE_REQUEST', {
        id:            request.id,
        fromCity:      request.fromCity,
        toCity:        request.toCity,
        date:          request.date,
        departureTime: request.departureTime,
        seats:         request.seats,
        note:          request.note,
        passenger: {
          id:     (request.passenger as any).id,
          name:   (request.passenger as any).name,
          avatar: (request.passenger as any).avatar,
        },
      });
    } catch (e) { console.error('[Socket] SCHEDULE_REQUEST broadcast failed:', e); }

    return request;
  }

  // ── Driver: get all OPEN requests (for their feed) ────────────────────────
  async getOpenRequests(driverId: string, page = 1, limit = 20) {
    const today = new Date().toISOString().split('T')[0];
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.scheduleRequest.findMany({
        where:   { status: 'OPEN', date: { gte: today } },
        include: {
          passenger: PASSENGER_INCLUDE,
          bids: {
            where:  { driverId },
            select: { id: true, status: true, pricePerSeat: true, departureTime: true, vehicleId: true, note: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.scheduleRequest.count({ where: { status: 'OPEN', date: { gte: today } } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit) },
    };
  }

  // ── Passenger: get their own requests with bids ────────────────────────────
  async getMyRequests(passengerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.scheduleRequest.findMany({
        where:   { passengerId },
        include: {
          bids: {
            include: {
              driver:  DRIVER_INCLUDE,
              vehicle: VEHICLE_INCLUDE,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.scheduleRequest.count({ where: { passengerId } }),
    ]);

    const mapped = data.map(req => ({
      ...req,
      bids: req.bids.map(withDriverRating),
    }));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit) },
    };
  }

  // ── Driver: place a bid on a request ─────────────────────────────────────
  async placeBid(scheduleRequestId: string, driverId: string, data: {
    pricePerSeat: number; vehicleId: string; note?: string;
  }) {
    const request = await prisma.scheduleRequest.findUnique({
      where:   { id: scheduleRequestId },
      include: { passenger: PASSENGER_INCLUDE },
    });
    if (!request) throw AppError.notFound('Schedule request not found');
    if (request.status !== 'OPEN') throw AppError.badRequest('This request is no longer open');

    const today = new Date().toISOString().split('T')[0];
    if (request.date < today) throw AppError.badRequest('Request date has passed');

    if (!data.vehicleId) throw AppError.badRequest('Please select a vehicle for your bid');

    // Departure time comes from the passenger's request
    const departureTime = (request as any).departureTime || '00:00';

    // Upsert — driver can update their existing bid
    const bid = await prisma.rideBid.upsert({
      where:  { scheduleRequestId_driverId: { scheduleRequestId, driverId } },
      create: {
        scheduleRequestId, driverId,
        vehicleId:     data.vehicleId,
        pricePerSeat:  data.pricePerSeat,
        departureTime,
        note:          data.note,
        createdBy:     driverId,
        updatedBy:     driverId,
      },
      update: {
        pricePerSeat:  data.pricePerSeat,
        vehicleId:     data.vehicleId,
        departureTime,
        note:          data.note,
        status:        'PENDING',
        updatedBy:     driverId,
      },
      include: { driver: DRIVER_INCLUDE, vehicle: VEHICLE_INCLUDE },
    });

    // Notify passenger: new bid received
    notify({
      userId:      request.passengerId,
      title:       'New Bid on Your Request! 💰',
      message:     `A driver offered Rs ${data.pricePerSeat}/seat for your ${request.fromCity} → ${request.toCity} request.`,
      type:        'RIDE_BID',
      socketEvent: 'RIDE_BID',
      socketData:  {
        scheduleRequestId,
        bid: withDriverRating(bid),
      },
    });

    // Confirm bid back to the driver in real-time so their card updates without refresh
    try {
      const { emitToUser } = await import('../socket');
      emitToUser(driverId, 'BID_PLACED', {
        scheduleRequestId,
        bid: { id: bid.id, status: bid.status, pricePerSeat: bid.pricePerSeat, departureTime: bid.departureTime, vehicleId: bid.vehicleId, note: bid.note },
      });
    } catch (e) { console.error('[Socket] BID_PLACED emit failed:', e); }

    return withDriverRating(bid);
  }

  // ── Passenger: accept a bid ───────────────────────────────────────────────
  async acceptBid(scheduleRequestId: string, bidId: string, passengerId: string) {
    const request = await prisma.scheduleRequest.findUnique({
      where:   { id: scheduleRequestId },
      include: { bids: { include: { driver: DRIVER_INCLUDE, vehicle: VEHICLE_INCLUDE } } },
    });
    if (!request) throw AppError.notFound('Schedule request not found');
    if (request.passengerId !== passengerId) throw AppError.forbidden('Not your request');
    if (request.status !== 'OPEN') throw AppError.badRequest('Request is no longer open');

    const bid = request.bids.find(b => b.id === bidId);
    if (!bid) throw AppError.notFound('Bid not found');
    if (bid.status !== 'PENDING') throw AppError.badRequest('Bid is no longer pending');

    // Transaction: accept bid, reject others, close request, create ride
    const result = await prisma.$transaction(async (tx) => {
      // Accept chosen bid
      await tx.rideBid.update({ where: { id: bidId }, data: { status: 'ACCEPTED', updatedBy: passengerId } });

      // Reject all other PENDING bids on this request
      const otherBidIds = request.bids.filter(b => b.id !== bidId && b.status === 'PENDING').map(b => b.id);
      if (otherBidIds.length) {
        await tx.rideBid.updateMany({
          where: { id: { in: otherBidIds } },
          data:  { status: 'REJECTED', updatedBy: passengerId },
        });
      }

      // Close the request
      await tx.scheduleRequest.update({
        where: { id: scheduleRequestId },
        data:  { status: 'ACCEPTED', updatedBy: passengerId },
      });

      if (!bid.vehicleId) throw new Error('Bid must have a vehicle selected');

      // Auto-create the ride for the driver
      const newRide = await tx.ride.create({
        data: {
          driverId:      bid.driverId,
          vehicleId:     bid.vehicleId,
          fromCity:      request.fromCity,
          toCity:        request.toCity,
          date:          request.date,
          departureTime: (request as any).departureTime || (bid as any).departureTime || '00:00',
          pricePerSeat:  bid.pricePerSeat,
          totalSeats:    request.seats,
          description:   `Ride created from schedule request. ${request.note || ''}`.trim(),
          createdBy:     bid.driverId,
          updatedBy:     bid.driverId,
        },
      });

      // Update bid with rideId
      await tx.rideBid.update({ where: { id: bidId }, data: { rideId: newRide.id } });

      // Auto-book the passenger on this ride
      await tx.booking.create({
        data: {
          rideId:      newRide.id,
          passengerId,
          seats:       request.seats,
          totalAmount: bid.pricePerSeat * request.seats,
          status:      'CONFIRMED',
          boardingCity: request.fromCity,
          exitCity:     request.toCity,
          createdBy:   passengerId,
          updatedBy:   passengerId,
        },
      });

      await tx.ride.update({
        where: { id: newRide.id },
        data:  { bookedSeats: { increment: request.seats } },
      });

      return { newRide, otherBidIds };
    });

    // ── Notifications ────────────────────────────────────────────────────────

    // Notify accepted driver
    notify({
      userId:      bid.driverId,
      title:       'Bid Accepted! 🎉',
      message:     `Your bid for ${request.fromCity} → ${request.toCity} on ${request.date} was accepted at Rs ${bid.pricePerSeat}/seat. A ride has been created for you!`,
      type:        'BID_ACCEPTED',
      rideId:      result.newRide.id,
      socketEvent: 'BID_ACCEPTED',
      socketData:  {
        scheduleRequestId,
        bidId,
        rideId:   result.newRide.id,
        fromCity: request.fromCity,
        toCity:   request.toCity,
        date:     request.date,
      },
    });

    // Notify rejected drivers
    if (result.otherBidIds.length) {
      const rejectedBids = request.bids.filter(b => result.otherBidIds.includes(b.id));
      for (const rb of rejectedBids) {
        notify({
          userId:      rb.driverId,
          title:       'Bid Not Selected',
          message:     `Your bid for ${request.fromCity} → ${request.toCity} on ${request.date} was not selected.`,
          type:        'BID_REJECTED',
          socketEvent: 'BID_REJECTED',
          socketData:  { scheduleRequestId, bidId: rb.id },
        });
      }
    }

    // Notify passenger: booking confirmed
    notify({
      userId:  passengerId,
      title:   'Ride Booked! 🚗',
      message: `Your ${request.fromCity} → ${request.toCity} ride on ${request.date} is confirmed at Rs ${bid.pricePerSeat}/seat.`,
      type:    'BOOKING',
      rideId:  result.newRide.id,
    });

    return result.newRide;
  }

  // ── Passenger: reject a specific bid ─────────────────────────────────────
  async rejectBid(scheduleRequestId: string, bidId: string, passengerId: string) {
    const request = await prisma.scheduleRequest.findUnique({ where: { id: scheduleRequestId } });
    if (!request) throw AppError.notFound('Schedule request not found');
    if (request.passengerId !== passengerId) throw AppError.forbidden('Not your request');

    const bid = await prisma.rideBid.findUnique({ where: { id: bidId } });
    if (!bid || bid.scheduleRequestId !== scheduleRequestId) throw AppError.notFound('Bid not found');
    if (bid.status !== 'PENDING') throw AppError.badRequest('Bid is no longer pending');

    await prisma.rideBid.update({ where: { id: bidId }, data: { status: 'REJECTED', updatedBy: passengerId } });

    notify({
      userId:      bid.driverId,
      title:       'Bid Rejected',
      message:     `Your bid for ${request.fromCity} → ${request.toCity} on ${request.date} was not selected.`,
      type:        'BID_REJECTED',
      socketEvent: 'BID_REJECTED',
      socketData:  { scheduleRequestId, bidId },
    });

    return { success: true };
  }

  // ── Passenger: cancel their request ──────────────────────────────────────
  async cancelRequest(scheduleRequestId: string, passengerId: string) {
    const request = await prisma.scheduleRequest.findUnique({
      where:   { id: scheduleRequestId },
      include: { bids: { where: { status: 'PENDING' }, select: { driverId: true } } },
    });
    if (!request) throw AppError.notFound('Schedule request not found');
    if (request.passengerId !== passengerId) throw AppError.forbidden('Not your request');
    if (request.status === 'CANCELLED') throw AppError.badRequest('Already cancelled');
    if (request.status === 'ACCEPTED')  throw AppError.badRequest('Cannot cancel an accepted request');

    await prisma.$transaction([
      prisma.scheduleRequest.update({
        where: { id: scheduleRequestId },
        data:  { status: 'CANCELLED', updatedBy: passengerId },
      }),
      prisma.rideBid.updateMany({
        where: { scheduleRequestId, status: 'PENDING' },
        data:  { status: 'WITHDRAWN' },
      }),
    ]);

    // Notify all drivers who bid
    if (request.bids.length) {
      notifyMany({
        userIds:     request.bids.map(b => b.driverId),
        title:       'Request Cancelled',
        message:     `The ${request.fromCity} → ${request.toCity} schedule request on ${request.date} was cancelled by the passenger.`,
        type:        'SCHEDULE_REQUEST',
        socketEvent: 'REQUEST_CANCELLED',
        socketData:  { scheduleRequestId, fromCity: request.fromCity, toCity: request.toCity },
      });
    }

    return { success: true };
  }

  // ── Driver: withdraw their bid ────────────────────────────────────────────
  async withdrawBid(scheduleRequestId: string, bidId: string, driverId: string) {
    const bid = await prisma.rideBid.findUnique({
      where:   { id: bidId },
      include: { scheduleRequest: true },
    });
    if (!bid || bid.scheduleRequestId !== scheduleRequestId) throw AppError.notFound('Bid not found');
    if (bid.driverId !== driverId) throw AppError.forbidden('Not your bid');
    if (bid.status !== 'PENDING') throw AppError.badRequest('Can only withdraw a pending bid');

    await prisma.rideBid.update({ where: { id: bidId }, data: { status: 'WITHDRAWN', updatedBy: driverId } });

    notify({
      userId:      bid.scheduleRequest.passengerId,
      title:       'A Driver Withdrew Their Bid',
      message:     `A driver withdrew their bid for your ${bid.scheduleRequest.fromCity} → ${bid.scheduleRequest.toCity} request.`,
      type:        'RIDE_BID',
      socketEvent: 'BID_WITHDRAWN',
      socketData:  { scheduleRequestId, bidId },
    });

    return { success: true };
  }
}

export const scheduleRequestService = new ScheduleRequestService();
