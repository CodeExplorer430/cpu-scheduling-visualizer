import { Router } from 'express';
import { updateProfile, updateSettings, getAnalytics } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.patch('/profile', updateProfile);
router.patch('/settings', updateSettings);
router.get('/analytics', getAnalytics);

export default router;
