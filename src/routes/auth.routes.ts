import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createUserSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } from '../validators';
import { validate } from '../middleware/validate.middleware';
import { Request } from '../utils/custom-request';

const router = Router();

router.post('/register', validate(createUserSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

router.get('/me', authMiddleware, authController.getProfile);
router.patch('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);

export default router;