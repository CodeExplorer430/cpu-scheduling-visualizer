import 'dotenv/config';
import app from './app.js';
import { connectDB } from './db/index.js';

// Connect to Database
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
