import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { register, login, getMe } from '../controllers/authController.js';
import { IUser } from '../models/User.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, issue JWT and redirect
    const user = req.user as IUser;
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Redirect to frontend with token
    // In production, use a secure cookie or a dedicated success page
    // For this prototype, we'll redirect with query param (simplest for SPA)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?token=${token}`);
  }
);

export default router;
