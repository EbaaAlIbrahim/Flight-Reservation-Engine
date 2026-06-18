import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 🟢 Object mapping completely bypasses URL parsing and reads parameters natively!
const pool = new Pool({
  user: 'postgres.zhrjtakyegbtvnrwycig', // Your exact user string
  password: 'E11eqaa@eqaa',               // Your raw password with the @ symbol works safely here!
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,                             // High-speed optimized transaction pooler port
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
