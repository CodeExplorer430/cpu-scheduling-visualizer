import mongoose, { Schema, Document } from 'mongoose';
import { Process } from '@cpu-vis/shared';

export interface IScenario extends Document {
  userId: string;
  name: string;
  description?: string;
  processes: Process[];
  createdAt: Date;
}

const ScenarioSchema: Schema = new Schema({
  userId: { type: String, required: false }, // Optional for public/guest scenarios
  name: { type: String, required: true },
  description: { type: String },
  processes: { type: Array, required: true }, // Storing Process[] as JSON array
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IScenario>('Scenario', ScenarioSchema);
