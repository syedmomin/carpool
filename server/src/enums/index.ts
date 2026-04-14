export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER    = 'DRIVER',
  ADMIN     = 'ADMIN',
}

export enum RideStatus {
  ACTIVE      = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED   = 'COMPLETED',
  CANCELLED   = 'CANCELLED',
  EXPIRED     = 'EXPIRED',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum VehicleType {
  CAR     = 'CAR',
  VAN     = 'VAN',
  HIACE   = 'HIACE',
  COASTER = 'COASTER',
  BUS     = 'BUS',
}

export enum NotificationType {
  BOOKING          = 'BOOKING',
  RIDE             = 'RIDE',
  REMINDER         = 'REMINDER',
  NEW_RIDE         = 'NEW_RIDE',
  RIDE_CANCELLED   = 'RIDE_CANCELLED',
  RIDE_EXPIRED     = 'RIDE_EXPIRED',
  SCHEDULE_REQUEST = 'SCHEDULE_REQUEST',
  RIDE_BID         = 'RIDE_BID',
  BID_ACCEPTED     = 'BID_ACCEPTED',
  BID_REJECTED     = 'BID_REJECTED',
  SYSTEM           = 'SYSTEM',
}

export enum ScheduleRequestStatus {
  OPEN      = 'OPEN',
  ACCEPTED  = 'ACCEPTED',
  EXPIRED   = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum BidStatus {
  PENDING   = 'PENDING',
  ACCEPTED  = 'ACCEPTED',
  REJECTED  = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum VerificationStatus {
  PENDING  = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION  = 'production',
  TEST        = 'test',
}
