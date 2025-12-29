import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log("⚠️ No MONGODB_URI found, using demo data.");
  // If we don't have a URI, disable buffering on all models
  // to prevent Mongoose from waiting for a connection that will never happen.
  mongoose.set('bufferCommands', false);
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!MONGODB_URI) {
    // If no URI is provided, do not attempt to connect.
    // The data functions will fall back to demo data.
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Keep buffering enabled when we have a URI
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on connection error
    throw e;
  }
  
  return cached.conn;
}

export default dbConnect;
