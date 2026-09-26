import { Router } from 'express';
import { adjustmentController } from '../controllers/adjustment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWarehouseStaff, requireInventoryManager } from '../middleware/role.middleware';
import { createAdjustmentSchema, updateAdjustmentSchema, idParamSchema, adjustmentQuerySchema } from '../validators';
import { validate } from '../middleware/validate.middleware';
import { Request } from '../utils/custom-request';

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouseStaff);

router.post('/', validate(createAdjustmentSchema), adjustmentController.create);
router.get('/', validate(adjustmentQuerySchema), adjustmentController.findAll);
router.get('/:id', validate(idParamSchema), adjustmentController.findById);
router.patch('/:id', validate(idParamSchema), validate(updateAdjustmentSchema), adjustmentController.update);
router.post('/:id/validate', validate(idParamSchema), requireInventoryManager, adjustmentController.validate);
router.post('/:id/cancel', validate(idParamSchema), requireInventoryManager, adjustmentController.cancel);

export default router;