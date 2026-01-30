import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      passwordHash,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, username: newUser.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profile: newUser.profile,
        settings: newUser.settings,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // Expect middleware to attach user to req (we'll implement middleware next)
    // For now, let's just assume we extract it from token if not attached
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    interface TokenPayload {
      userId: string;
      username: string;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requestMagicLink = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let user = await User.findOne({ email });
    if (!user) {
      // Auto-register user with magic link if they don't exist
      user = await User.create({
        email,
        username: email.split('@')[0],
      });
    }

    const token = jwt.sign({ userId: user._id, type: 'magic_link' }, JWT_SECRET, {
      expiresIn: '15m',
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLink = `${frontendUrl}/login?magicToken=${token}`;

    // In a real app, we would use an email service here.
    // For this project, we'll log it to console and return success.
    console.log(`[MAGIC LINK] Sent to ${email}: ${magicLink}`);

    res.json({ message: 'Magic link sent! Check your console (in dev) or email.' });
  } catch (error) {
    console.error('Magic link request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyMagicLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'magic_link') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const authToken = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token: authToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
      },
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired magic link' });
  }
};
