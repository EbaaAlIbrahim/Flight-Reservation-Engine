import pool from '../config/db';

export async function seedMockData() {
  try {
    console.log(' Seeding production-ready flight registration and loyalty data...');

    // 1. Insert modern commercial flights with split code and brand attributes
    const flight1 = await pool.query(`
      INSERT INTO flights (flight_number, airline_name, origin, destination, departure_time, arrival_time, capacity, available_seats)
      VALUES ('AA100', 'American Airlines', 'JFK', 'LAX', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '8 hours', 150, 0)
      RETURNING flight_id;
    `);
    const cancelledFlightId = flight1.rows[0].flight_id;

    const flight2 = await pool.query(`
      INSERT INTO flights (flight_number, airline_name, origin, destination, departure_time, arrival_time, capacity, available_seats)
      VALUES 
      ('AA102', 'American Airlines', 'JFK', 'LAX', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '10 hours', 150, 4),
      ('UA405', 'United Airlines', 'EWR', 'LAX', NOW() + INTERVAL '5 hours', NOW() + INTERVAL '11 hours', 180, 6),
      ('DL889', 'Delta Air Lines', 'JFK', 'LAX', NOW() + INTERVAL '8 hours', NOW() + INTERVAL '14 hours', 200, 10)
      RETURNING flight_id, flight_number, available_seats;
    `);

    // 2. AUTOMATED FIX: Generate a physical seating array matching each flight's exact count
    const rowLetters = ['A', 'B'];
    
    for (const flightRow of flight2.rows) {
      const fId = flightRow.flight_id;
      const totalSeatsToCreate = flightRow.available_seats; // Matches the exact available seat capacity count

      console.log(` Generating ${totalSeatsToCreate} interactive seats for Flight ${flightRow.flight_number}...`);
      
      // Calculate how many rows we need to create (2 seats per row: A and B)
      const rowsNeeded = Math.ceil(totalSeatsToCreate / 2);
      let seatsCreatedCount = 0;

      for (let r = 1; r <= rowsNeeded; r++) {
        for (const letter of rowLetters) {
          if (seatsCreatedCount >= totalSeatsToCreate) break;

          const generatedSeatNumber = `${r}${letter}`; // e.g., '1A', '1B', '2A'
          
          await pool.query(`
            INSERT INTO seats (flight_id, seat_number, is_booked)
            VALUES ($1, $2, FALSE)
            ON CONFLICT DO NOTHING;
          `, [fId, generatedSeatNumber]);

          seatsCreatedCount++;
        }
      }
    }

    // 3. Insert passengers including mock passwords and lifetime loyalty metrics
    const passengerData = [
      { first: 'Alice', last: 'Smith', email: 'alice@platinum.com', tier: 'PLATINUM', flights: 45 },
      { first: 'Bob', last: 'Jones', email: 'bob@gold.com', tier: 'GOLD', flights: 28 },
      { first: 'Charlie', last: 'Brown', email: 'charlie@silver.com', tier: 'SILVER', flights: 12 },
      { first: 'David', last: 'Miller', email: 'david@normal.com', tier: 'NORMAL', flights: 2 }
    ];

    const passengerIds: number[] = [];
    for (const p of passengerData) {
      const res = await pool.query(`
        INSERT INTO passengers (first_name, last_name, email, password_hash, loyalty_tier, lifetime_flights_booked)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING passenger_id;
      `, [p.first, p.last, p.email, 'mock_encrypted_password_123', p.tier, p.flights]);
      passengerIds.push(res.rows[0].passenger_id);
    }

    // 4. Link these seeded passengers onto the initial canceled flight
    for (const id of passengerIds) {
      await pool.query(`
        INSERT INTO bookings (passenger_id, flight_id, seat_number, status)
        VALUES ($1, $2, '14C', 'DISRUPTED');
      `, [id, cancelledFlightId]);
    }

    console.log(' Seeding complete! All flights initialized with matched seat arrays.');
  } catch (error) {
    console.error(' Error seeding data:', error);
    throw error;
  }
}
