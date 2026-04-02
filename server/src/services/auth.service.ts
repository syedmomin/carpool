import { User } from '@prisma/client';
import prisma from '../data-source';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'PASSENGER' | 'DRIVER';
  city?: string;
}

interface LoginDto {
  phone: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (exists) throw AppError.conflict('Email or phone already registered');

    const hashed = await hashPassword(dto.password);
    const user   = await prisma.user.create({
      data: {
        name:     dto.name,
        email:    dto.email,
        phone:    dto.phone,
        password: hashed,
        role:     dto.role ?? 'PASSENGER',
        city:     dto.city,
      },
    });

    return this.buildTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || !user.isActive) throw AppError.unauthorized('Invalid credentials');

    const valid = await comparePassword(dto.password, user.password);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    return this.buildTokens(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) throw AppError.badRequest('Current password is incorrect');

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }

  async refresh(token: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) throw AppError.unauthorized('User not found or inactive');

    return this.buildTokens(user);
  }

  private buildTokens(user: User): AuthTokens {
    const payload = { id: user.id, email: user.email, role: user.role as any };
    const { password: _, ...safeUser } = user;
    return {
      accessToken:  signToken(payload),
      refreshToken: signRefreshToken(payload),
      user:         safeUser,
    };
  }
}

export const authService = new AuthService();
