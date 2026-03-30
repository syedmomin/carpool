import { UserVerification, VerificationStatus } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';

type CreateCnicDto = { userId: string; cnicNumber: string; cnicFront?: string; cnicBack?: string };
type UpdateCnicDto = {
  cnicStatus?: VerificationStatus;
  rejectedReason?: string;
  cnicFront?: string;
  cnicBack?: string;
};

export class CnicService extends BaseService<UserVerification, CreateCnicDto, UpdateCnicDto> {
  protected get model()     { return prisma.userVerification; }
  protected get modelName() { return 'UserVerification'; }

  async submitVerification(dto: CreateCnicDto, createdBy: string): Promise<UserVerification> {
    const existing = await prisma.userVerification.findUnique({ where: { userId: dto.userId } });

    if (existing) {
      if (existing.cnicStatus === 'APPROVED') throw AppError.conflict('CNIC already verified');
      // Re-submission allowed if pending or rejected
      return prisma.userVerification.update({
        where: { userId: dto.userId },
        data:  { ...dto, cnicStatus: 'PENDING', rejectedReason: null, updatedBy: createdBy },
      });
    }

    return this.create(dto, createdBy);
  }

  async getMyStatus(userId: string): Promise<UserVerification | null> {
    return prisma.userVerification.findUnique({ where: { userId } });
  }

  async getPending() {
    return prisma.userVerification.findMany({
      where:   { cnicStatus: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    adminId: string,
    rejectedReason?: string,
  ): Promise<UserVerification> {
    const record = await this.getById(id);

    const updated = await prisma.userVerification.update({
      where: { id },
      data:  { cnicStatus: status, rejectedReason: rejectedReason ?? null, updatedBy: adminId },
    });

    // Mark user as verified if approved
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: (record as any).userId },
        data:  { isVerified: true, updatedBy: adminId },
      });
    }

    return updated;
  }
}

export const cnicService = new CnicService();
