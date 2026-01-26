import { Router } from 'express';
import multer from 'multer';
import {
  createScenario,
  getScenarios,
  getScenarioById,
  uploadCSV,
} from '../controllers/scenarioController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Applying authentication middleware to all scenario routes
// except maybe uploadCSV if we want guests to use it?
// Let's protect them all for consistency with "persistence" requirements.
router.use(authenticate);

router.post('/', createScenario);
router.get('/', getScenarios);
router.get('/:id', getScenarioById);
router.post('/upload/csv', upload.single('file'), uploadCSV);

export default router;
