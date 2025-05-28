import Redis from 'ioredis';
import { REDIS_URL } from './env';

export const redis = new Redis(REDIS_URL);

redis.on('connect', () => {
  console.log('[Redis] Connected');
});
redis.on('error', (err) => {
  console.error('[Redis] Error:', err);
});
