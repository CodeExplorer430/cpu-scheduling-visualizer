import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { SimulationHistory } from '../models/SimulationHistory.js';
import { TokenPayload } from '../middleware/auth.js';

interface AuthRequest extends Request {
  auth?: TokenPayload;
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { username, bio, avatarUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    if (bio !== undefined) user.profile.bio = bio;
    if (avatarUrl !== undefined) user.profile.avatarUrl = avatarUrl;

    await user.save();
    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      settings: user.settings,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { theme, language, defaultAlgorithm } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (theme) user.settings.theme = theme;
    if (language) user.settings.language = language;
    if (defaultAlgorithm !== undefined) user.settings.defaultAlgorithm = defaultAlgorithm;

    await user.save();
    return res.json(user.settings);
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const history = await SimulationHistory.find({ userId }).sort({ createdAt: -1 }).limit(50);

    // Aggregate some stats
    const stats = await SimulationHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$algorithm',
          count: { $sum: 1 },
          avgWaitTime: { $avg: '$metrics.avgWaitTime' },
          avgTurnaroundTime: { $avg: '$metrics.avgTurnaroundTime' },
        },
      },
    ]);

    return res.json({ history, stats });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
