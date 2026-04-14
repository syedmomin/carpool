import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { AppError } from './AppError';

const JWT_SECRET         = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_SECRET     = process.env.JWT_REFRESH_SECRET!;
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

export const signRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, REFRESH_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
};
