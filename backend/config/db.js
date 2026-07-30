import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codearena';
  
  try {
    console.log(`Connecting to database at ${MONGO_URI}...`);
    // Connect with a 2-second timeout so it doesn't hang forever if MongoDB is not running
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Local MongoDB connection failed: ${error.message}`);
    console.log('Attempting in-memory MongoDB fallback...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      
      console.log(`Spinning up memory database instance...`);
      const conn = await mongoose.connect(memoryUri);
      console.log(`MongoDB (In-Memory Fallback) Connected: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`MongoDB Fallback Connection Error: ${fallbackError.message}`);
      console.error('Please ensure MongoDB is running or configure MONGO_URI in .env');
      process.exit(1);
    }
  }
};
