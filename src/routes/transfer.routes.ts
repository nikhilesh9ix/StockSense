import { Router } from 'express';
import { transferController } from '../controllers/transfer.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWarehouseStaff, requireInventoryManager } from '../middleware/role.middleware';
import { createTransferSchema, updateTransferSchema, idParamSchema, transferQuerySchema } from '../validators';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouseStaff);

router.post('/', validate(createTransferSchema), transferController.create);
router.get('/', validate(transferQuerySchema), transferController.findAll);
router.get('/:id', validate(idParamSchema), transferController.findById);
router.patch('/:id', validate(idParamSchema), validate(updateTransferSchema), transferController.update);
router.post('/:id/validate', validate(idParamSchema), requireInventoryManager, transferController.validate);
router.post('/:id/cancel', validate(idParamSchema), requireInventoryManager, transferController.cancel);

export default router;