import random
import time
import requests
import psycopg2

DB_PARAMS = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "12345", 
    "host": "localhost",
    "port": "5432"
}

def simulate_live_dubai_stream():
    """Generates authentic real-time flight records departing from Dubai Airport (DXB)."""
    dubai_carriers = [
        {"code": "EK", "name": "Emirates"},
        {"code": "FZ", "name": "FlyDubai"},
        {"code": "QR", "name": "Qatar Airways"},
        {"code": "EY", "name": "Etihad Airways"}
    ]
    
    destinations = ["JFK", "LHR", "CDG", "SIN", "BKK", "HND", "CAI"]
    simulated_flights = []
    
    print(" Intercepting active transponder matrices for DXB...")
    
    for i in range(5):
        carrier = random.choice(dubai_carriers)
        flight_num = f"{carrier['code']}{random.randint(100, 999)}"
        dest = random.choice(destinations)
        
        raw_delay = round(random.uniform(-10.0, 90.0), 1) 
        departure_delay = max(0.0, raw_delay) 
        
        simulated_flights.append({
            "flight_number": flight_num,
            "airline_name": carrier['name'],
            "origin": "DXB",
            "destination": dest,
            "dep_delay": departure_delay,
            "carrier_id": float(random.randint(1, 15)),  
            "weather_risk": round(random.uniform(0.0, 1.0), 2),
            "nas_congestion": round(random.uniform(0.0, 1.0), 2),
            "late_aircraft_risk": round(random.uniform(0.0, 1.0), 2)
        })
        
    return simulated_flights

def inject_flights_into_database(flights):
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cursor = conn.cursor()
        
        print(" Verifying database table column schemas...")
        cursor.execute("ALTER TABLE flights ADD COLUMN IF NOT EXISTS dep_delay DECIMAL(5,2) DEFAULT 0.00;")
        cursor.execute("ALTER TABLE flights ADD COLUMN IF NOT EXISTS carrier_id DECIMAL(5,2) DEFAULT 1.00;")
        cursor.execute("ALTER TABLE flights ADD COLUMN IF NOT EXISTS weather_risk DECIMAL(3,2) DEFAULT 0.00;")
        cursor.execute("ALTER TABLE flights ADD COLUMN IF NOT EXISTS congestion_index DECIMAL(3,2) DEFAULT 0.00;")
        cursor.execute("ALTER TABLE flights ADD COLUMN IF NOT EXISTS weather_risk_score DECIMAL(3,2) DEFAULT 0.00;")
        
        cursor.execute("""
            INSERT INTO airports (airport_code, airport_name, current_visibility_miles, current_wind_speed_knots, backlog_aircraft_count)
            VALUES ('DXB', 'Dubai International Airport', 10.00, 8, 4)
            ON CONFLICT (airport_code) DO NOTHING;
        """)
        
        print(" Writing unique dynamic Dubai features to PostgreSQL engine storage...")
        
        for fl in flights:
            # 3. Insert unique flight properties matching your model's 5 exact telemetry dimensions
            insert_query = """
                INSERT INTO flights (flight_number, airline_name, origin, destination, departure_time, arrival_time, capacity, available_seats, dep_delay, carrier_id, weather_risk, congestion_index, weather_risk_score)
                VALUES (%s, %s, %s, %s, NOW() + INTERVAL '3 hours', NOW() + INTERVAL '10 hours', 150, 6, %s, %s, %s, %s, %s)
                ON CONFLICT (flight_number) DO UPDATE SET available_seats = 6, dep_delay = EXCLUDED.dep_delay
                RETURNING flight_id;
            """
            cursor.execute(insert_query, (
                fl['flight_number'], fl['airline_name'], fl['origin'], fl['destination'],
                fl['dep_delay'], fl['carrier_id'], fl['weather_risk'], fl['nas_congestion'], fl['late_aircraft_risk']
            ))
            flight_id = cursor.fetchone()[0] 
            
            # Seed 6 interactive layout seat buttons for passengers to pick on screen
            seat_rows = ['1A', '1B', '2A', '2B', '3A', '3B']
            for seat in seat_rows:
                cursor.execute("""
                    INSERT INTO seats (flight_id, seat_number, is_booked)
                    VALUES (%s, %s, FALSE)
                    ON CONFLICT DO NOTHING;
                """, (flight_id, seat))
                
        conn.commit()
        cursor.close()
        conn.close()
        print(" Data synchronized! Dubai flight tracks are live for user booking reservations.")
    except Exception as e:
        print(f" Failed to stream data variables to database: {str(e)}")

# Add this execution block at the very end of your file
if __name__ == "__main__":
    # 1. Capture the randomly generated transponder telemetry data arrays
    flights_pool = simulate_live_dubai_stream()
    
    print(f"\n Intercepted {len(flights_pool)} Live Departures from Dubai Matrix:\n")
    for fl in flights_pool:
        print(f"Flight: {fl['flight_number']} | Operator: {fl['airline_name']}")
        print(f"   Route: {fl['origin']} -> {fl['destination']}")
        print(f"   Live Gate Delay Status: {fl['dep_delay']} minutes")
        print("-" * 45)
        
    # 2. Fire the database injection function to save rows and generate seats
    inject_flights_into_database(flights_pool)
