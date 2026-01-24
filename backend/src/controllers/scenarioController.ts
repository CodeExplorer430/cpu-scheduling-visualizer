import { Request, Response } from 'express';
import Scenario from '../models/Scenario.js';
import { validateProcesses } from '@cpu-vis/shared';

export const createScenario = async (req: Request, res: Response) => {
  try {
    const { name, description, processes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const validation = validateProcesses(processes);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const newScenario = new Scenario({
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

export const getScenarios = async (req: Request, res: Response) => {
  try {
    // Return list with basic info, sorted by newest
    const scenarios = await Scenario.find({}, 'name description createdAt').sort({ createdAt: -1 });
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
