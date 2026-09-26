import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWarehouseStaff } from '../middleware/role.middleware';
import { idParamSchema, inventoryQuerySchema, productIdParamSchema, locationIdParamSchema } from '../validators';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouseStaff);

router.get('/', validate(inventoryQuerySchema), inventoryController.findAll);
router.get('/product/:productId', validate(productIdParamSchema), inventoryController.findByProduct);
router.get('/location/:locationId', validate(locationIdParamSchema), inventoryController.findByLocation);

export default router;