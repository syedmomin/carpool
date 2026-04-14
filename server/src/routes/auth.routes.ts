import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// ─── Rate limiting ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register',
  registerLimiter,
  validate([
    { field: 'name',     required: true,  min: 2,  max: 60  },
    { field: 'phone',    required: true,  type: 'phone'      },
    { field: 'email',    required: true,  type: 'email'      },
    { field: 'password', required: true,  min: 6,  max: 100 },
  ]),
  authController.register,
);

router.post('/login',
  loginLimiter,
  validate([
    { field: 'phone',    required: true, type: 'phone' },
    { field: 'password', required: true               },
  ]),
  authController.login,
);

router.get('/me',               authenticate, authController.me);
router.post('/logout',          authenticate, authController.logout);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/refresh',
  validate([{ field: 'refreshToken', required: true }]),
  authController.refresh,
);

export default router;
