import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Construct the secure cloud Redis connection URL string
// Upstash provides a connection string format: rediss://default:password@host:port
const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  connectTimeout: 10000, // Prevent the serverless container from stalling indefinitely
});

redis.on('connect', () => {
  console.log('🚀 Secure Cloud Redis Connection Initialized successfully!');
});

redis.on('error', (err) => {
  console.error('❌ Cloud Redis Socket Error:', err);
});

export default redis;
