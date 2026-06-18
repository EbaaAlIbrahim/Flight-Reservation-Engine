import pool from '../config/db';
import redis from '../config/redis';

export async function syncFlightInventoryToCache() {
  try {
    console.log('⚡ Syncing live flight inventory from PostgreSQL to Upstash Redis...');
    
    // Fetch all active flights from the database
    const result = await pool.query('SELECT flight_id, flight_number, available_seats FROM flights');
    
    // Clean loop using your custom redis wrapper methods safely
    for (const flight of result.rows) {
      // Store available seats using your custom wrapper set method
      await redis.set(`flight:seats:${flight.flight_number}`, String(flight.available_seats));
    }
    
    console.log(' Live seat inventory securely cached in memory!');
  } catch (error) {
    console.error(' Failed to sync inventories to cache:', error);
    throw error;
  }
}
