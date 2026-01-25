import { Router } from 'express';
import { runSimulation, runBatchSimulation } from '../controllers/simulationController.js';

const router = Router();

router.post('/', runSimulation);
router.post('/batch', runBatchSimulation);

export default router;
