import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

redis.on('connect', () => {
  console.log(' Connected to Memurai Redis Cache engine network');
});

// Added explicit :Error type to fix parameter 'err' implicitly has an 'any' type
redis.on('error', (err: Error) => {
  console.error(' Memurai Redis Connection Error:', err);
});

export default redis;
