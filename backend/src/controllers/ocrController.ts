import { Request, Response } from 'express';
import { OCR_SPACE_API_KEY } from '../config/index.js';
import { OcrSpaceResponse, parseProcessTableFromOcr } from '../services/ocrProcessTable.js';

const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const getOcrErrorMessage = (payload: OcrSpaceResponse): string => {
  if (Array.isArray(payload.ErrorMessage)) {
    return payload.ErrorMessage.join(', ');
  }

  return payload.ErrorMessage || payload.ErrorDetails || 'OCR provider request failed.';
};

export const parseProcessTableImage = async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY || OCR_SPACE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OCR integration is not configured on the server.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image uploads are supported.' });
    }

    if (req.file.size > MAX_IMAGE_SIZE_BYTES) {
      return res.status(400).json({ error: 'Image exceeds the 5 MB upload limit.' });
    }

    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('language', 'eng');
    formData.append('isTable', 'true');
    formData.append('scale', 'true');
    formData.append('detectOrientation', 'true');
    formData.append('OCREngine', '2');
    const fileBytes = Uint8Array.from(req.file.buffer);

    formData.append(
      'file',
      new Blob([fileBytes], { type: req.file.mimetype }),
      req.file.originalname || 'process-table.jpg'
    );

    const response = await fetch(OCR_SPACE_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return res.status(502).json({ error: `OCR provider returned ${response.status}.` });
    }

    const payload = (await response.json()) as OcrSpaceResponse;
    if (payload.IsErroredOnProcessing) {
      return res.status(502).json({ error: getOcrErrorMessage(payload) });
    }

    const parsed = parseProcessTableFromOcr(payload);
    if (parsed.processes.length === 0) {
      return res.status(400).json({
        error: 'No valid process rows were found in the uploaded image.',
        warnings: parsed.warnings,
      });
    }

    return res.json(parsed);
  } catch (error) {
    console.error('OCR image parse error:', error);
    return res.status(500).json({ error: 'Failed to parse the uploaded image.' });
  }
};
