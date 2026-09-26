import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWarehouseStaff } from '../middleware/role.middleware';
import { dashboardQuerySchema } from '../validators';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouseStaff);

router.get('/summary', validate(dashboardQuerySchema), dashboardController.getSummary);
router.get('/documents', validate(dashboardQuerySchema), dashboardController.getFilteredDocuments);

export default router;