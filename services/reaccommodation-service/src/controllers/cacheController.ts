import pool from '../config/db';
import redis from '../config/redis';

export async function syncFlightInventoryToCache() {
  try {
    console.log('⚡ Syncing live flight inventory from PostgreSQL to Memurai...');
    
    // Fetch all active flights from the relational database
    const result = await pool.query('SELECT flight_id, flight_number, available_seats FROM flights');
    
    // Multi-write optimization pipeline for Redis
    const pipeline = redis.pipeline();
    
    for (const flight of result.rows) {
      // Store available seats using a Redis Hash map key: 'flight:seats'
      pipeline.hset('flight:seats', flight.flight_number, flight.available_seats);
    }
    
    // Execute all cache injections in a single ultra-fast network trip
    await pipeline.exec();
    console.log(' Live seat inventory securely cached in memory!');
  } catch (error) {
    console.error(' Failed to sync inventories to cache:', error);
    throw error;
  }
}
