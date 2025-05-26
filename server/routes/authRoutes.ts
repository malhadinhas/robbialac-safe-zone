import { Router } from 'express';
import { login, sendVerificationCode, register, verifyEmail } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/send-code', sendVerificationCode);
router.post('/register', register);
router.post('/verify-email', verifyEmail);

export default router; 