import mongoose, { Schema, Document } from 'mongoose';
import { Process } from '@cpu-vis/shared';

export interface IScenario extends Document {
  name: string;
  description?: string;
  processes: Process[];
  createdAt: Date;
}

const ScenarioSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  processes: { type: Array, required: true }, // Storing Process[] as JSON array
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IScenario>('Scenario', ScenarioSchema);
