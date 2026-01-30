import 'dotenv/config';
import app from './app.js';
import { connectDB } from './db/index.js';

// Connect to Database
(async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to DB connection error:', error);
    process.exit(1);
  }
})();
