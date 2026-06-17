import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Enforce SSL connection requirements needed by Supabase in production cloud systems
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false
});

export default pool;
