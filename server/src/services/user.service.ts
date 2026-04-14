import { User } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';
import { PaginationQuery } from '../types';

type CreateUserDto = {
  name: string; email: string; phone: string;
  password: string; role?: string; city?: string;
};
type UpdateUserDto = {
  name?: string; phone?: string; city?: string; avatar?: string;
};

export class UserService extends BaseService<User, CreateUserDto, UpdateUserDto> {
  protected get model()     { return prisma.user; }
  protected get modelName() { return 'User'; }

  async getPublicProfile(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, avatar: true, city: true, isVerified: true, createdAt: true,
        cnicVerification: { select: { status: true } },
        _count: { select: { ridesAsDriver: true, reviews: true } },
        vehicles: {
          where: { isActive: true },
          take: 1,
          select: { id: true, brand: true, model: true, type: true, images: true, ac: true, wifi: true },
        },
      },
    });
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  async getProfile(id: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        vehicles:        { where: { isActive: true }, take: 1 },
        cnicVerification: { select: { status: true } },
        _count: {
          select: {
            ridesAsDriver: true,
            bookings:      true,
            reviews:       true,
          },
        },
      },
    });
    if (!user) throw AppError.notFound('User not found');
    const { password: _, ...safe } = user as any;
    return safe;
  }

  async updateProfile(id: string, dto: UpdateUserDto, updatedBy: string): Promise<Omit<User, 'password'>> {
    // Phone uniqueness check
    if (dto.phone) {
      const exists = await prisma.user.findFirst({
        where: { phone: dto.phone, id: { not: id } },
      });
      if (exists) throw AppError.conflict('Phone number already in use');
    }

    const user = await prisma.user.update({
      where: { id },
      data:  { ...dto, updatedBy },
    });
    const { password: _, ...safe } = user as any;
    return safe;
  }

  async getAllUsers(query: PaginationQuery) {
    return this.getAll(
      query,
      { isActive: true },
      { _count: { select: { ridesAsDriver: true, bookings: true } } },
    );
  }

  async deactivateUser(id: string, adminId: string): Promise<void> {
    await this.getById(id);
    await prisma.user.update({
      where: { id },
      data:  { isActive: false, updatedBy: adminId },
    });
  }
}

export const userService = new UserService();
