import prisma from '../data-source';
import { emitToUser } from '../socket';

export class ChatService {
  /**
   * Get messages for a specific booking
   */
  async getMessages(bookingId: string) {
    return await prisma.chatMessage.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });
  }

  /**
   * Save a new message
   */
  async saveMessage(bookingId: string, senderId: string, content: string) {
    const message = await prisma.chatMessage.create({
      data: {
        bookingId,
        senderId,
        content
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        },
        booking: {
          select: {
            passengerId: true,
            ride: {
              select: { driverId: true }
            }
          }
        }
      }
    });

    // Notify the other party if they aren't in the chat room (optional: push notifications)
    // For now, socket takes care of real-time if they are in the room.
    
    return message;
  }

  /**
   * Clear all messages for a ride (triggered on completion)
   */
  async clearChatByRide(rideId: string) {
    console.log(`[ChatService] Clearing messages for ride: ${rideId}`);
    return await prisma.chatMessage.deleteMany({
      where: {
        booking: { rideId }
      }
    });
  }
}

export const chatService = new ChatService();
