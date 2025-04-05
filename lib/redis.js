// lib/redis.js
import { createClient } from 'redis';

// Create a single Redis client for your app
export const redisClient = createClient({
  url: process.env.REDIS_URL, // e.g. "redis://default:password@localhost:6379"
});

// Connect on import
redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis');
  }
})();