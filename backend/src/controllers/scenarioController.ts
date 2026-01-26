import { Request, Response } from 'express';
import Scenario from '../models/Scenario.js';
import { validateProcesses } from '@cpu-vis/shared';
import { parse } from 'csv-parse/sync';
import { AuthRequest } from '../middleware/auth.js';

export const createScenario = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, processes } = req.body;
    const userId = req.user?.userId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const validation = validateProcesses(processes);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const newScenario = new Scenario({
      userId,
      name,
      description,
      processes,
    });

    const saved = await newScenario.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Create scenario error:', error);
    return res.status(500).json({ error: 'Failed to create scenario' });
  }
};

export const getScenarios = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    // Return list with basic info, sorted by newest. Filter by userId if present.
    const query = userId ? { userId } : {};
    const scenarios = await Scenario.find(query, 'name description createdAt').sort({ createdAt: -1 });
    return res.json(scenarios);
  } catch (error) {
    console.error('Get scenarios error:', error);
    return res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
};

export const getScenarioById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scenario = await Scenario.findById(id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    return res.json(scenario);
  } catch (error) {
    console.error('Get scenario error:', error);
    return res.status(500).json({ error: 'Failed to fetch scenario' });
  }
};

export const uploadCSV = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString();
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
      trim: true,
    });

    // Map to Process type with flexible column names
    const processes = records.map((r: Record<string, unknown>, index: number) => ({
      pid: String(r.pid || r.PID || r.id || r.ID || `P${index + 1}`),
      arrival: Number(
        r.arrival !== undefined ? r.arrival : r.Arrival !== undefined ? r.Arrival : 0
      ),
      burst: Number(r.burst !== undefined ? r.burst : r.Burst !== undefined ? r.Burst : 1),
      priority:
        r.priority !== undefined
          ? Number(r.priority)
          : r.Priority !== undefined
            ? Number(r.Priority)
            : undefined,
    }));

    const validation = validateProcesses(processes);
    if (!validation.valid) {
      return res.status(400).json({ error: `Invalid processes in CSV: ${validation.error}` });
    }

    return res.json({ processes });
  } catch (error) {
    console.error('CSV upload error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: `Failed to parse CSV: ${message}` });
  }
};
