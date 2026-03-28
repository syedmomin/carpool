import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import prisma from '../data-source';
import { ResponseUtil } from '../utils/response';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate);

// Submit CNIC (passengers and drivers)
router.post('/cnic', async (req: any, res, next) => {
  try {
    const { cnicNumber, cnicFront, cnicBack } = req.body;
    if (!cnicNumber) throw AppError.badRequest('CNIC number is required');

    const sanitizedCnic = String(cnicNumber).replace(/[^0-9\-]/g, '').slice(0, 20);

    const existing = await prisma.userVerification.findUnique({ where: { userId: req.user.id } });
    let record;
    if (existing) {
      record = await prisma.userVerification.update({
        where: { userId: req.user.id },
        data: { cnicNumber: sanitizedCnic, cnicFront, cnicBack, cnicStatus: 'PENDING', updatedBy: req.user.id },
      });
    } else {
      record = await prisma.userVerification.create({
        data: { userId: req.user.id, cnicNumber: sanitizedCnic, cnicFront, cnicBack, cnicStatus: 'PENDING', createdBy: req.user.id, updatedBy: req.user.id },
      });
    }
    ResponseUtil.success(res, record, 'CNIC submitted for verification');
  } catch (err) { next(err); }
});

// Submit driving licence (drivers only)
router.post('/licence', async (req: any, res, next) => {
  try {
    if (req.user.role !== 'DRIVER') throw AppError.forbidden('Only drivers can submit a licence');
    const { licenceImage } = req.body;
    if (!licenceImage) throw AppError.badRequest('Licence image is required');

    const existing = await prisma.userVerification.findUnique({ where: { userId: req.user.id } });
    let record;
    if (existing) {
      record = await prisma.userVerification.update({
        where: { userId: req.user.id },
        data: { licenceImage, licenceStatus: 'PENDING', updatedBy: req.user.id },
      });
    } else {
      record = await prisma.userVerification.create({
        data: { userId: req.user.id, licenceImage, licenceStatus: 'PENDING', createdBy: req.user.id, updatedBy: req.user.id },
      });
    }
    ResponseUtil.success(res, record, 'Licence submitted for verification');
  } catch (err) { next(err); }
});

// Get verification status
router.get('/status', async (req: any, res, next) => {
  try {
    const record = await prisma.userVerification.findUnique({ where: { userId: req.user.id } });
    ResponseUtil.success(res, record || null, 'Verification status');
  } catch (err) { next(err); }
});

export default router;
