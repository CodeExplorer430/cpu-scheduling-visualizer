import { Router } from 'express';
import multer from 'multer';
import {
  createScenario,
  getScenarios,
  getScenarioById,
  uploadCSV,
} from '../controllers/scenarioController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', createScenario);
router.get('/', getScenarios);
router.get('/:id', getScenarioById);
router.post('/upload/csv', upload.single('file'), uploadCSV);

export default router;
