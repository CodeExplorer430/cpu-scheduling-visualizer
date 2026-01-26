import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);

export default router;
