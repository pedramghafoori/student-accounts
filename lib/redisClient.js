// lib/redisClient.js
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('Redis URL:', redisUrl);
console.log('Environment variables:', {
  REDIS_URL: process.env.REDIS_URL,
  NODE_ENV: process.env.NODE_ENV
});

let client;

if (!global.__redisClient) {
  client = createClient({ url: redisUrl });
  client.on('error', (err) => console.error('Redis Client Error', err));

  await client.connect();

  global.__redisClient = client;
} else {
  client = global.__redisClient;
}

export default client;