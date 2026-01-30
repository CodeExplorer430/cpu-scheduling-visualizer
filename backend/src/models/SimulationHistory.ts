import { Schema, model, Document } from 'mongoose';

export interface ISimulationHistory extends Document {
  userId: string;
  algorithm: string;
  processesCount: number;
  metrics: {
    avgWaitTime: number;
    avgTurnaroundTime: number;
    cpuUtilization: number;
  };
  createdAt: Date;
}

const simulationHistorySchema = new Schema<ISimulationHistory>({
  userId: { type: String, required: true, index: true },
  algorithm: { type: String, required: true },
  processesCount: { type: Number, required: true },
  metrics: {
    avgWaitTime: { type: Number, required: true },
    avgTurnaroundTime: { type: Number, required: true },
    cpuUtilization: { type: Number, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export const SimulationHistory = model<ISimulationHistory>(
  'SimulationHistory',
  simulationHistorySchema
);
