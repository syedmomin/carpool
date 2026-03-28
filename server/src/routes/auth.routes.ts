import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.post('/register',
  validate([
    { field: 'name',     required: true,  min: 2,  max: 60  },
    { field: 'phone',    required: true,  type: 'phone'      },
    { field: 'email',    required: true,  type: 'email'      },
    { field: 'password', required: true,  min: 6,  max: 100 },
  ]),
  authController.register,
);

router.post('/login',
  validate([
    { field: 'phone',    required: true, type: 'phone' },
    { field: 'password', required: true               },
  ]),
  authController.login,
);

router.get('/me',               authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
