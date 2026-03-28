export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER    = 'DRIVER',
  ADMIN     = 'ADMIN',
}

export enum RideStatus {
  ACTIVE    = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
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
  BOOKING   = 'BOOKING',
  RIDE      = 'RIDE',
  REMINDER  = 'REMINDER',
  NEW_RIDE  = 'NEW_RIDE',
  SYSTEM    = 'SYSTEM',
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
