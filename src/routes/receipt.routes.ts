import { Router } from 'express';
import { receiptController } from '../controllers/receipt.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWarehouseStaff, requireInventoryManager } from '../middleware/role.middleware';
import { createReceiptSchema, updateReceiptSchema, idParamSchema, receiptQuerySchema } from '../validators';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouseStaff);

router.post('/', validate(createReceiptSchema), receiptController.create);
router.get('/', validate(receiptQuerySchema), receiptController.findAll);
router.get('/:id', validate(idParamSchema), receiptController.findById);
router.patch('/:id', validate(idParamSchema), validate(updateReceiptSchema), receiptController.update);
router.post('/:id/validate', validate(idParamSchema), requireInventoryManager, receiptController.validate);
router.post('/:id/cancel', validate(idParamSchema), requireInventoryManager, receiptController.cancel);

export default router;