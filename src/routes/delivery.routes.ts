import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWarehouseStaff, requireInventoryManager } from '../middleware/role.middleware';
import { createDeliverySchema, updateDeliverySchema, idParamSchema, deliveryQuerySchema } from '../validators';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouseStaff);

router.post('/', validate(createDeliverySchema), deliveryController.create);
router.get('/', validate(deliveryQuerySchema), deliveryController.findAll);
router.get('/:id', validate(idParamSchema), deliveryController.findById);
router.patch('/:id', validate(idParamSchema), validate(updateDeliverySchema), deliveryController.update);
router.post('/:id/pick', validate(idParamSchema), deliveryController.pick);
router.post('/:id/pack', validate(idParamSchema), deliveryController.pack);
router.post('/:id/validate', validate(idParamSchema), requireInventoryManager, deliveryController.validate);
router.post('/:id/cancel', validate(idParamSchema), requireInventoryManager, deliveryController.cancel);

export default router;