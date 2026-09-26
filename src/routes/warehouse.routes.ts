import { Router } from 'express';
import { warehouseController } from '../controllers/warehouse.controller';
import { locationController } from '../controllers/location.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireInventoryManager, requireWarehouseStaff } from '../middleware/role.middleware';
import { createWarehouseSchema, updateWarehouseSchema, idParamSchema, createLocationSchema, updateLocationSchema, warehouseIdParamSchema } from '../validators';
import { validate } from '../middleware/validate.middleware';
import { Request } from '../utils/custom-request';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createWarehouseSchema), requireInventoryManager, warehouseController.create);
router.get('/', requireWarehouseStaff, warehouseController.findAll);
router.get('/:id', validate(idParamSchema), requireWarehouseStaff, warehouseController.findById);
router.patch('/:id', validate(idParamSchema), validate(updateWarehouseSchema), requireInventoryManager, warehouseController.update);
router.delete('/:id', validate(idParamSchema), requireInventoryManager, warehouseController.delete);

// Location routes under warehouse
router.post('/:warehouseId/locations', validate(warehouseIdParamSchema), validate(createLocationSchema), requireInventoryManager, locationController.create);
router.get('/:warehouseId/locations', validate(warehouseIdParamSchema), requireWarehouseStaff, locationController.findAll);

// Location routes by ID
router.get('/locations/:id', validate(idParamSchema), requireWarehouseStaff, locationController.findById);
router.patch('/locations/:id', validate(idParamSchema), validate(updateLocationSchema), requireInventoryManager, locationController.update);
router.delete('/locations/:id', validate(idParamSchema), requireInventoryManager, locationController.delete);

export default router;