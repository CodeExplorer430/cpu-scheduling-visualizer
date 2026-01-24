import { Router } from 'express';
import { runSimulation } from '../controllers/simulationController.js';

const router = Router();

router.post('/', runSimulation);

export default router;
