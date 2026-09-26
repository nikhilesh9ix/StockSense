import { Router } from 'express';
import { ledgerController } from '../controllers/ledger.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWarehouseStaff } from '../middleware/role.middleware';
import { idParamSchema, ledgerQuerySchema, productIdParamSchema, locationIdParamSchema } from '../validators';
import { validate } from '../middleware/validate.middleware';
import { Request } from '../utils/custom-request';

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouseStaff);

router.get('/', validate(ledgerQuerySchema), ledgerController.findAll);
router.get('/:id', validate(idParamSchema), ledgerController.findById);
router.get('/product/:productId', validate(productIdParamSchema), validate(ledgerQuerySchema), ledgerController.findByProduct);
router.get('/location/:locationId', validate(locationIdParamSchema), validate(ledgerQuerySchema), ledgerController.findByLocation);

export default router;