// ─── Validation Field Error Shape ────────────────────────────────────────────
export interface FieldError {
  field: string;
  message: string;
}

// ─── Custom Application Error ─────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: FieldError[];

  constructor(message: string, statusCode = 500, errors?: FieldError[]) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = true;
    this.errors        = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: FieldError[]) { return new AppError(message, 400, errors); }
  static unauthorized(message = 'Unauthorized')              { return new AppError(message, 401); }
  static forbidden(message = 'Forbidden')                    { return new AppError(message, 403); }
  static notFound(message = 'Not found')                     { return new AppError(message, 404); }
  static conflict(message: string)                           { return new AppError(message, 409); }
  static internal(message = 'Internal server error')         { return new AppError(message, 500); }
}
