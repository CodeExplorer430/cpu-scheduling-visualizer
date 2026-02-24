import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      const msg = 'MONGODB_URI is not defined in .env.';
      if (process.env.NODE_ENV === 'production') {
        console.error(msg + ' Exiting.');
        process.exit(1);
      }
      console.warn(msg + ' Skipping DB connection.');
      return;
    }

    await mongoose.connect(mongoURI);
    const connectionInfo = `${mongoose.connection.host}/${mongoose.connection.name}`;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB Connected: ${connectionInfo}`);
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Make sure your IP is whitelisted in MongoDB Atlas.');
    process.exit(1);
  }
};
