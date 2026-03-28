import { CnicVerification } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';

type CreateCnicDto = { userId: string; cnicNumber: string; frontImage?: string; backImage?: string };
type UpdateCnicDto = {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectedReason?: string;
  frontImage?: string;
  backImage?: string;
};

export class CnicService extends BaseService<CnicVerification, CreateCnicDto, UpdateCnicDto> {
  protected get model()     { return prisma.cnicVerification; }
  protected get modelName() { return 'CnicVerification'; }

  async submitVerification(dto: CreateCnicDto, createdBy: string): Promise<CnicVerification> {
    const existing = await prisma.cnicVerification.findUnique({ where: { userId: dto.userId } });

    if (existing) {
      if (existing.status === 'APPROVED') throw AppError.conflict('CNIC already verified');
      // Re-submission allowed if pending or rejected
      return prisma.cnicVerification.update({
        where: { userId: dto.userId },
        data:  { ...dto, status: 'PENDING', rejectedReason: null, updatedBy: createdBy },
      });
    }

    return this.create(dto, createdBy);
  }

  async getMyStatus(userId: string): Promise<CnicVerification | null> {
    return prisma.cnicVerification.findUnique({ where: { userId } });
  }

  async getPending() {
    return prisma.cnicVerification.findMany({
      where:   { status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    adminId: string,
    rejectedReason?: string,
  ): Promise<CnicVerification> {
    const record = await this.getById(id);

    const updated = await prisma.cnicVerification.update({
      where: { id },
      data:  { status, rejectedReason: rejectedReason ?? null, updatedBy: adminId },
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
