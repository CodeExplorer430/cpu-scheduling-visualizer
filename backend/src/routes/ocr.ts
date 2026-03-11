import { Router } from 'express';
import multer from 'multer';
import { parseProcessTableImage } from '../controllers/ocrController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process-table', upload.single('file'), parseProcessTableImage);

export default router;
