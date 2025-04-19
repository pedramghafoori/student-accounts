// lib/redisClient.js
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPassword = process.env.REDIS_PASSWORD;

console.log('Redis URL:', redisUrl);
console.log('Environment variables:', {
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '***' : 'not set',
  NODE_ENV: process.env.NODE_ENV
});

let client;

if (!global.__redisClient) {
  console.log('Creating new Redis client...');
  try {
    client = createClient({ 
      url: redisUrl,
      password: redisPassword,
      socket: {
        connectTimeout: 10000,
        keepAlive: 10000,
        reconnectStrategy: (retries) => {
          console.log(`Redis reconnection attempt ${retries}`);
          if (retries > 5) {
            console.error('Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
    });
    
    client.on('connect', () => console.log('Redis Client Connected'));
    client.on('ready', () => console.log('Redis Client Ready'));
    client.on('end', () => console.log('Redis Client Connection Ended'));
    client.on('reconnecting', () => console.log('Redis Client Reconnecting'));

    console.log('Attempting to connect to Redis...');
    await client.connect();
    console.log('Redis connection successful');
    
    // Test the connection
    console.log('Testing Redis connection...');
    await client.set('test', 'connection');
    const testValue = await client.get('test');
    console.log('Redis test value:', testValue);
    await client.del('test');
    console.log('Redis connection test successful');

    global.__redisClient = client;
  } catch (err) {
    console.error('Failed to initialize Redis client:', err);
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
    throw err;
  }
} else {
  console.log('Using existing Redis client');
  client = global.__redisClient;
}

export default client;