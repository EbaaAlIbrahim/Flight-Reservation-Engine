import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Break down your Supabase parameters explicitly to prevent @ parsing crashes
const pool = new Pool({
  user: 'postgres',
  password: 'E11eqaa@eqaa', // Raw string handles special characters safely
  host: 'db.zhrjtakyegbtvnrwycig.supabase.co',
  port: 5432,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
