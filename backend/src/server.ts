import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './db/index.js';

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
