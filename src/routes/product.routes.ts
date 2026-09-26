import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireInventoryManager, requireWarehouseStaff } from '../middleware/role.middleware';
import { createProductSchema, updateProductSchema, idParamSchema, productQuerySchema } from '../validators';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createProductSchema), requireInventoryManager, productController.create);
router.get('/', validate(productQuerySchema), requireWarehouseStaff, productController.findAll);
router.get('/:id', validate(idParamSchema), requireWarehouseStaff, productController.findById);
router.patch('/:id', validate(idParamSchema), validate(updateProductSchema), requireInventoryManager, productController.update);
router.delete('/:id', validate(idParamSchema), requireInventoryManager, productController.delete);

export default router;