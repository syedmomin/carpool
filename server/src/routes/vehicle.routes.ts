import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.use(authenticate, authorize('DRIVER'));

router.get('/',          vehicleController.getMyVehicles);
router.get('/:id',       vehicleController.getById);

router.post('/',
  validate([
    { field: 'type',        required: true },
    { field: 'brand',       required: true },
    { field: 'plateNumber', required: true },
    { field: 'totalSeats',  required: true, type: 'number' },
  ]),
  vehicleController.register,
);

router.put('/:id',          vehicleController.updateVehicle);
router.delete('/:id',       vehicleController.deleteVehicle);
router.post('/:id/activate', vehicleController.setActive);

export default router;
