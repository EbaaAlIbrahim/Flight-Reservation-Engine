import fs from 'fs';
import path from 'path';
import pool from '../config/db';

export async function initializeDatabase() {
  try {
    console.log(' Checking relational database infrastructure states...');
    
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'passengers'
      );
    `);
    
    const tablesExist = tableCheck.rows[0].exists;

    if (tablesExist) {
      console.log(' Database structures detected. Verifying structural columns and tables matrix paths...');
      
      // 1. Auto-patch the missing delay column if it doesn't exist
      await pool.query(`
        ALTER TABLE flights ADD COLUMN IF NOT EXISTS predicted_delay_minutes INT DEFAULT 0;
      `);

      // 2. AUTOMATED FIX: Force create the passenger_notifications table dynamically on disk if missing
      await pool.query(`
        CREATE TABLE IF NOT EXISTS passenger_notifications (
            notification_id SERIAL PRIMARY KEY,
            passenger_id INT REFERENCES passengers(passenger_id) ON DELETE CASCADE,
            title VARCHAR(150) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(20) DEFAULT 'INFO', 
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log(' Structure patch complete: "passenger_notifications" and delay parameters are verified live.');
      return false; 
    }

    console.log(' Tables missing. Provisioning fresh relational data architecture arrays...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(sql);
    console.log(' Relational flight disruption tables created successfully!');
    return true; 
  } catch (error) {
    console.error(' Error executing database initialization checks:', error);
    throw error;
  }
}
