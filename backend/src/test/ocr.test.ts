import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { parseProcessTableFromOcr } from '../services/ocrProcessTable.js';

describe('OCR API Tests', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OCR_SPACE_API_KEY;

  beforeEach(() => {
    process.env.OCR_SPACE_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.OCR_SPACE_API_KEY;
    } else {
      process.env.OCR_SPACE_API_KEY = originalApiKey;
    }
    vi.restoreAllMocks();
  });

  it('POST /api/ocr/process-table should parse OCR rows into processes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ParsedResults: [
          {
            TextOverlay: {
              Lines: [
                {
                  LineText: 'PID Arrival Burst Priority',
                  MinTop: 0,
                  MaxHeight: 10,
                  Words: [
                    { WordText: 'PID', Left: 0, Top: 0, Width: 20, Height: 10 },
                    { WordText: 'Arrival', Left: 60, Top: 0, Width: 40, Height: 10 },
                    { WordText: 'Burst', Left: 140, Top: 0, Width: 30, Height: 10 },
                    { WordText: 'Priority', Left: 220, Top: 0, Width: 50, Height: 10 },
                  ],
                },
                {
                  LineText: 'P1 0 5 2',
                  MinTop: 20,
                  MaxHeight: 10,
                  Words: [
                    { WordText: 'P1', Left: 0, Top: 20, Width: 20, Height: 10 },
                    { WordText: '0', Left: 70, Top: 20, Width: 10, Height: 10 },
                    { WordText: '5', Left: 150, Top: 20, Width: 10, Height: 10 },
                    { WordText: '2', Left: 235, Top: 20, Width: 10, Height: 10 },
                  ],
                },
              ],
            },
          },
        ],
      }),
    }) as typeof global.fetch;

    const response = await request(app)
      .post('/api/ocr/process-table')
      .attach('file', Buffer.from('image-bytes'), {
        filename: 'table.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.processes).toEqual([
      {
        pid: 'P1',
        arrival: 0,
        burst: 5,
        priority: 2,
        tickets: 1,
        shareGroup: 'default',
        shareWeight: 1,
        deadline: 5,
        period: 5,
      },
    ]);
    expect(response.body.warnings).toContain('Row 1: missing tickets, defaulted to 1.');
  });

  it('POST /api/ocr/process-table should return 400 when OCR yields no valid rows', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ParsedResults: [
          {
            ParsedText: 'nonsense without a usable process table',
          },
        ],
      }),
    }) as typeof global.fetch;

    const response = await request(app)
      .post('/api/ocr/process-table')
      .attach('file', Buffer.from('image-bytes'), {
        filename: 'table.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('No valid process rows');
    expect(response.body.warnings[0]).toContain('header row');
  });

  it('should parse multi-word share headers from OCR overlay text', () => {
    const result = parseProcessTableFromOcr({
      ParsedResults: [
        {
          TextOverlay: {
            Lines: [
              {
                LineText: 'PID Arrival Burst Share Group Share Weight',
                MinTop: 0,
                MaxHeight: 10,
                Words: [
                  { WordText: 'PID', Left: 0, Top: 0, Width: 20, Height: 10 },
                  { WordText: 'Arrival', Left: 60, Top: 0, Width: 40, Height: 10 },
                  { WordText: 'Burst', Left: 140, Top: 0, Width: 30, Height: 10 },
                  { WordText: 'Share', Left: 210, Top: 0, Width: 35, Height: 10 },
                  { WordText: 'Group', Left: 250, Top: 0, Width: 35, Height: 10 },
                  { WordText: 'Share', Left: 320, Top: 0, Width: 35, Height: 10 },
                  { WordText: 'Weight', Left: 360, Top: 0, Width: 45, Height: 10 },
                ],
              },
              {
                LineText: 'P1 0 5 batch 3',
                MinTop: 20,
                MaxHeight: 10,
                Words: [
                  { WordText: 'P1', Left: 0, Top: 20, Width: 20, Height: 10 },
                  { WordText: '0', Left: 70, Top: 20, Width: 10, Height: 10 },
                  { WordText: '5', Left: 150, Top: 20, Width: 10, Height: 10 },
                  { WordText: 'batch', Left: 235, Top: 20, Width: 35, Height: 10 },
                  { WordText: '3', Left: 375, Top: 20, Width: 10, Height: 10 },
                ],
              },
            ],
          },
        },
      ],
    });

    expect(result.processes).toEqual([
      expect.objectContaining({
        pid: 'P1',
        arrival: 0,
        burst: 5,
        shareGroup: 'batch',
        shareWeight: 3,
      }),
    ]);
  });

  it('should ignore malformed overlay words instead of throwing', () => {
    const result = parseProcessTableFromOcr({
      ParsedResults: [
        {
          TextOverlay: {
            Lines: [
              {
                LineText: 'PID Arrival Burst Priority',
                MinTop: 0,
                MaxHeight: 10,
                Words: [
                  { WordText: 'PID', Left: 0, Top: 0, Width: 20, Height: 10 },
                  { WordText: 'Arrival', Left: 60, Top: 0, Width: 40, Height: 10 },
                  { WordText: 'Burst', Left: 140, Top: 0, Width: 30, Height: 10 },
                  { WordText: 'Priority', Top: 0, Width: 50, Height: 10 } as never,
                ],
              },
              {
                LineText: 'P1 0 5 2',
                MinTop: 20,
                MaxHeight: 10,
                Words: [
                  { WordText: 'P1', Left: 0, Top: 20, Width: 20, Height: 10 },
                  { WordText: '0', Left: 70, Top: 20, Width: 10, Height: 10 },
                  { WordText: '5', Left: 150, Top: 20, Width: 10, Height: 10 },
                  { WordText: '2', Left: 235, Top: 20, Width: 10, Height: 10 },
                ],
              },
            ],
          },
        },
      ],
    });

    expect(result.processes).toEqual([
      expect.objectContaining({
        pid: 'P1',
        arrival: 0,
        burst: 5,
      }),
    ]);
    expect(result.processes[0]).not.toHaveProperty('priority', 2);
  });

  it('should keep valid last-column values near the right edge of the detected header span', () => {
    const result = parseProcessTableFromOcr({
      ParsedResults: [
        {
          TextOverlay: {
            Lines: [
              {
                LineText: 'PID Arrival Burst Priority',
                MinTop: 0,
                MaxHeight: 10,
                Words: [
                  { WordText: 'PID', Left: 0, Top: 0, Width: 20, Height: 10 },
                  { WordText: 'Arrival', Left: 60, Top: 0, Width: 40, Height: 10 },
                  { WordText: 'Burst', Left: 140, Top: 0, Width: 30, Height: 10 },
                  { WordText: 'Priority', Left: 220, Top: 0, Width: 50, Height: 10 },
                ],
              },
              {
                LineText: 'P1 0 5 2',
                MinTop: 20,
                MaxHeight: 10,
                Words: [
                  { WordText: 'P1', Left: 0, Top: 20, Width: 20, Height: 10 },
                  { WordText: '0', Left: 70, Top: 20, Width: 10, Height: 10 },
                  { WordText: '5', Left: 150, Top: 20, Width: 10, Height: 10 },
                  { WordText: '2', Left: 258, Top: 20, Width: 10, Height: 10 },
                ],
              },
            ],
          },
        },
      ],
    });

    expect(result.processes).toEqual([
      expect.objectContaining({
        pid: 'P1',
        arrival: 0,
        burst: 5,
        priority: 2,
      }),
    ]);
  });
});
