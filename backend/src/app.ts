import express from 'express';
import cors from 'cors';
import passport from 'passport';
import './config/passport.js'; // Configure passport strategies
import simulateRouter from './routes/simulate.js';
import scenariosRouter from './routes/scenarios.js';
import authRouter from './routes/auth.js';

const app = express();

// Trust proxy is required for secure cookies and correct protocol detection on Render
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/scenarios', scenariosRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default app;
