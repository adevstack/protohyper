
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export const generateToken = (userId: number, email: string) => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
};
