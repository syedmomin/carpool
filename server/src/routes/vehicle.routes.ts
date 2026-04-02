import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate, authorize('DRIVER'));

router.get('/',          vehicleController.getMyVehicles);
router.get('/mine',      vehicleController.getMyVehicles);
router.get('/:id',       vehicleController.getById);

router.post('/',
  upload.array('images', 5),
  validate([
    { field: 'type',        required: true },
    { field: 'brand',       required: true },
    { field: 'plateNumber', required: true },
    { field: 'totalSeats',  required: true },
  ]),
  vehicleController.register,
);

router.put('/:id',
  upload.array('images', 5),
  vehicleController.updateVehicle
);
router.delete('/:id',       vehicleController.deleteVehicle);
router.post('/:id/activate', vehicleController.setActive);

export default router;
