import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 🟢 Encodings map the @ symbol to %40 safely to prevent URI syntax crashes
const pool = new Pool({
  connectionString: "postgresql://postgres.zhrjtakyegbtvnrwycig:E11eqaa%40eqaa@://supabase.com",
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
