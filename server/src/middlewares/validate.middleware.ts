import { Request, Response, NextFunction } from 'express';
import { AppError, FieldError } from '../utils/AppError';

type ValidationRule = {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'phone';
  min?: number;
  max?: number;
};

export const validate = (rules: ValidationRule[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const errors: FieldError[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];
      const add = (message: string) => errors.push({ field: rule.field, message });

      if (rule.required && (value === undefined || value === null || value === '')) {
        add('is required');
        continue;
      }
      if (value === undefined || value === null || value === '') continue;

      if (rule.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
          add('must be a valid email address');
      }

      if (rule.type === 'phone') {
        const digits = String(value).replace(/[\s\-]/g, '');
        if (!/^\d{11,13}$/.test(digits))
          add('must be 11–13 digits');
      }

      if (rule.type === 'number') {
        if (isNaN(Number(value))) {
          add('must be a number');
        } else {
          const num = Number(value);
          if (rule.min !== undefined && num < rule.min)
            add(`must be at least ${rule.min}`);
          if (rule.max !== undefined && num > rule.max)
            add(`must be at most ${rule.max}`);
        }
        continue;
      }

      if (rule.min !== undefined && String(value).length < rule.min) {
        add(`must be at least ${rule.min} characters`);
      }

      if (rule.max !== undefined && String(value).length > rule.max) {
        add(`must be at most ${rule.max} characters`);
      }
    }

    if (errors.length > 0) return next(AppError.badRequest('Validation failed', errors));
    next();
  };
