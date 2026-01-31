import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import {
  register,
  login,
  getMe,
  requestMagicLink,
  verifyMagicLink,
} from '../controllers/authController.js';
import { IUser } from '../models/User.js';
import { JWT_SECRET } from '../config/index.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);
router.post('/magic-link', requestMagicLink);
router.post('/magic-link/verify', verifyMagicLink);

// --- OAuth Helpers ---

const handleCallback = (req: Request, res: Response) => {
  // Successful authentication, issue JWT and redirect
  const user = req.user as unknown as IUser;
  const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });

  // Redirect to frontend with token
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}?token=${token}`);
};

const providers = [
  { name: 'google', scope: ['profile', 'email'] },
  { name: 'github', scope: ['user:email'] },
  { name: 'gitlab', scope: ['read_user'] },
  { name: 'discord', scope: ['identify', 'email'] },
  { name: 'linkedin', scope: ['openid', 'profile', 'email'] },
];

// --- OAuth Routes ---

providers.forEach(({ name, scope }) => {
  // Auth initiation
  router.get(`/${name}`, passport.authenticate(name, { scope }));

  // Callback
  router.get(
    `/${name}/callback`,
    passport.authenticate(name, { session: false, failureRedirect: '/login' }),
    handleCallback
  );
});

export default router;
