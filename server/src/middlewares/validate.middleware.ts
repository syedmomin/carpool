import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

type ValidationRule = {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email';
  min?: number;
  max?: number;
};

// ─── Simple Validator Middleware Factory ──────────────────────────────────────
export const validate = (rules: ValidationRule[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }
      if (value === undefined || value === null) continue;

      if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        errors.push(`${rule.field} must be a valid email`);
      }
      if (rule.type === 'number' && isNaN(Number(value))) {
        errors.push(`${rule.field} must be a number`);
      }
      if (rule.min !== undefined && String(value).length < rule.min) {
        errors.push(`${rule.field} must be at least ${rule.min} characters`);
      }
      if (rule.max !== undefined && String(value).length > rule.max) {
        errors.push(`${rule.field} must be at most ${rule.max} characters`);
      }
    }

    if (errors.length > 0) return next(AppError.badRequest('Validation failed', errors));
    next();
  };
