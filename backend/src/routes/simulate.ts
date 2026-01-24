import { Router, Request, Response } from 'express';
import { runFCFS, Process } from '@cpu-vis/shared';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { algorithm, processes } = req.body;

  if (!processes || !Array.isArray(processes)) {
     return res.status(400).json({ error: 'Invalid processes input' });
  }

  if (algorithm === 'FCFS') {
    const result = runFCFS(processes as Process[]);
    return res.json(result);
  } else {
    return res.status(400).json({ error: `Algorithm '${algorithm}' not supported yet` });
  }
});

export default router;
