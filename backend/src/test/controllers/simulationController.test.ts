import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { runSimulation, runBatchSimulation } from '../../controllers/simulationController.js';
import * as shared from '@cpu-vis/shared';

// Mock the shared library
vi.mock('@cpu-vis/shared', () => ({
  validateProcesses: vi.fn(),
  runFCFS: vi.fn(),
  runRR: vi.fn(),
  runSJF: vi.fn(),
  runLJF: vi.fn(),
  runSRTF: vi.fn(),
  runLRTF: vi.fn(),
  runPriority: vi.fn(),
  runPriorityPreemptive: vi.fn(),
  runMQ: vi.fn(),
  runMLFQ: vi.fn(),
  runHRRN: vi.fn(),
  runFairShare: vi.fn(),
  runLottery: vi.fn(),
  runEDF: vi.fn(),
  runRMS: vi.fn(),
}));

describe('Simulation Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    vi.clearAllMocks();
  });

  describe('runSimulation', () => {
    it('should return 400 if processes are invalid', () => {
      mockRequest.body = { processes: [], algorithm: 'FCFS' };
      vi.mocked(shared.validateProcesses).mockReturnValue({
        valid: false,
        error: 'Invalid processes',
      });

      runSimulation(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid processes' });
    });

    it('should run FCFS algorithm when specified', () => {
      mockRequest.body = { processes: [{ id: 1 }], algorithm: 'FCFS' };
      vi.mocked(shared.validateProcesses).mockReturnValue({ valid: true });
      const mockResult = { processes: [], stats: {} } as unknown as shared.SimulationResult;
      vi.mocked(shared.runFCFS).mockReturnValue(mockResult);

      runSimulation(mockRequest as Request, mockResponse as Response);

      expect(shared.runFCFS).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should default to FCFS if algorithm is missing', () => {
      mockRequest.body = { processes: [{ id: 1 }] }; // No algorithm
      vi.mocked(shared.validateProcesses).mockReturnValue({ valid: true });
      const mockResult = { processes: [], stats: {} } as unknown as shared.SimulationResult;
      vi.mocked(shared.runFCFS).mockReturnValue(mockResult);

      runSimulation(mockRequest as Request, mockResponse as Response);

      expect(shared.runFCFS).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 for unsupported algorithm', () => {
      mockRequest.body = { processes: [{ id: 1 }], algorithm: 'UNKNOWN_ALGO' };
      vi.mocked(shared.validateProcesses).mockReturnValue({ valid: true });

      runSimulation(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('not supported') })
      );
    });

    it('should handle internal errors gracefully', () => {
      mockRequest.body = { processes: [{ id: 1 }], algorithm: 'FCFS' };
      vi.mocked(shared.validateProcesses).mockReturnValue({ valid: true });
      vi.mocked(shared.runFCFS).mockImplementation(() => {
        throw new Error('Boom');
      });

      runSimulation(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal simulation error' });
    });
  });

  describe('runBatchSimulation', () => {
    it('should return 400 if algorithms array is missing', () => {
      mockRequest.body = { processes: [] }; // No algorithms

      runBatchSimulation(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Algorithms array is required' });
    });

    it('should run multiple algorithms and return results', () => {
      mockRequest.body = {
        processes: [{ id: 1 }],
        algorithms: ['FCFS', 'RR'],
      };
      vi.mocked(shared.validateProcesses).mockReturnValue({ valid: true });
      vi.mocked(shared.runFCFS).mockReturnValue({
        algo: 'FCFS',
      } as unknown as shared.SimulationResult);
      vi.mocked(shared.runRR).mockReturnValue({ algo: 'RR' } as unknown as shared.SimulationResult);

      runBatchSimulation(mockRequest as Request, mockResponse as Response);

      expect(shared.runFCFS).toHaveBeenCalled();
      expect(shared.runRR).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        FCFS: { algo: 'FCFS' },
        RR: { algo: 'RR' },
      });
    });

    it('should handle errors in individual algorithms within batch', () => {
      mockRequest.body = {
        processes: [{ id: 1 }],
        algorithms: ['FCFS', 'RR'],
      };
      vi.mocked(shared.validateProcesses).mockReturnValue({ valid: true });
      vi.mocked(shared.runFCFS).mockReturnValue({
        algo: 'FCFS',
      } as unknown as shared.SimulationResult);
      vi.mocked(shared.runRR).mockImplementation(() => {
        throw new Error('RR Failed');
      });

      runBatchSimulation(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        FCFS: { algo: 'FCFS' },
        RR: { error: 'RR Failed' },
      });
    });
  });
});
