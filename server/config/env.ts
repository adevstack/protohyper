import dotenv from 'dotenv';
dotenv.config();

console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('REDIS_URL:', process.env.REDIS_URL);

export const JWT_SECRET = process.env.JWT_SECRET!;
export const MONGODB_URI = process.env.MONGODB_URI!;
export const REDIS_URL = process.env.REDIS_URL!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

if (!REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}