const mongoose = require('mongoose');

const connectDB = async () => {
  // Check if we already have a connection or are in the process of connecting
  if (mongoose.connection.readyState >= 1) {
    console.log('MongoDB: Using existing database connection');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, retrying...');
    });
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
