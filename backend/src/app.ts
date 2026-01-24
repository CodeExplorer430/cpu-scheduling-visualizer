import express from 'express';
import cors from 'cors';
import simulateRouter from './routes/simulate.js';
import scenariosRouter from './routes/scenarios.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/simulate', simulateRouter);
app.use('/api/scenarios', scenariosRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default app;
