import pool from '../config/db';
import { SCHEMA_SQL } from './schema';

export async function initializeDatabase() {
  try {
    console.log(' Checking relational database infrastructure states...');
    
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'passengers'
      );
    `);
    
    const tablesExist = tableCheck.rows.length > 0 && tableCheck.rows[0].exists;

    if (tablesExist) {
      console.log(' Database structures detected. Verifying structural paths...');
      
      await pool.query(`
        ALTER TABLE flights ADD COLUMN IF NOT EXISTS predicted_delay_minutes INT DEFAULT 0;
      `);

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
      
      return false; 
    }

    console.log(' Tables missing. Provisioning fresh relational data architecture arrays directly from string bundle...');
    await pool.query(SCHEMA_SQL);
    console.log(' Relational flight disruption tables created successfully!');
    return true; 
  } catch (error) {
    console.error(' Error executing database initialization checks:', error);
    throw error;
  }
}
