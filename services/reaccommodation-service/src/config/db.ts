import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 🟢 IPv4-compatible proxy configuration for Vercel Serverless Functions
const pool = new Pool({
  user: 'postgres.zhrjtakyegbtvnrwycig', // 🔵 Change: Append your project reference ID to the user name
  password: 'E11eqaa@eqaa', 
  host: 'aws-0-eu-central-1.pooler.supabase.com', // 🔵 Change: Target Supabase's high-speed IPv4 proxy gateway
  port: 5432, // Connects cleanly via Session Mode
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
