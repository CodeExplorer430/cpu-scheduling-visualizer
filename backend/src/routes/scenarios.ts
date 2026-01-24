import { Router } from 'express';
import { createScenario, getScenarios, getScenarioById } from '../controllers/scenarioController.js';

const router = Router();

router.post('/', createScenario);
router.get('/', getScenarios);
router.get('/:id', getScenarioById);

export default router;
