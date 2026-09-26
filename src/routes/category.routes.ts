import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireInventoryManager } from '../middleware/role.middleware';
import { createCategorySchema, updateCategorySchema, idParamSchema } from '../validators';
import { validate } from '../middleware/validate.middleware';
import { Request } from '../utils/custom-request';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createCategorySchema), requireInventoryManager, categoryController.create);
router.get('/', categoryController.findAll);
router.get('/:id', validate(idParamSchema), categoryController.findById);
router.patch('/:id', validate(idParamSchema), validate(updateCategorySchema), requireInventoryManager, categoryController.update);
router.delete('/:id', validate(idParamSchema), requireInventoryManager, categoryController.delete);

export default router;