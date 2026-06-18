// services/reaccommodation-service/src/db/schema.ts
export const SCHEMA_SQL = `
-- Production Core Disruption & Booking Database Schema

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tier_level') THEN
        CREATE TYPE tier_level AS ENUM ('NORMAL', 'SILVER', 'GOLD', 'PLATINUM');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'CANCELLED', 'DISRUPTED', 'RE_ROUTED');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS passengers (
    passenger_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    loyalty_tier tier_level DEFAULT 'NORMAL',
    lifetime_flights_booked INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS flights (
    flight_id SERIAL PRIMARY KEY,
    flight_number VARCHAR(10) UNIQUE NOT NULL,
    airline_name VARCHAR(100) NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INT NOT NULL,
    available_seats INT NOT NULL,
    weather_risk_score DECIMAL(3,2) DEFAULT 0.00,
    congestion_index DECIMAL(3,2) DEFAULT 0.00,
    predictive_delay_probability DECIMAL(3,2) DEFAULT 0.00,
    predicted_delay_minutes INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS seats (
    seat_id SERIAL PRIMARY KEY,
    flight_id INT REFERENCES flights(flight_id) ON DELETE CASCADE,
    seat_number VARCHAR(5) NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    UNIQUE(flight_id, seat_number)
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id SERIAL PRIMARY KEY,
    passenger_id INT REFERENCES passengers(passenger_id) ON DELETE CASCADE,
    flight_id INT REFERENCES flights(flight_id) ON DELETE CASCADE,
    seat_number VARCHAR(5),
    status booking_status DEFAULT 'CONFIRMED',
    compensation_type VARCHAR(20) DEFAULT 'NONE',
    compensation_value INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(booking_id) ON DELETE CASCADE,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS passenger_notifications (
    notification_id SERIAL PRIMARY KEY,
    passenger_id INT REFERENCES passengers(passenger_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'INFO', 
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS airports (
    airport_code VARCHAR(3) PRIMARY KEY,
    airport_name VARCHAR(100) NOT NULL,
    current_visibility_miles DECIMAL(4,2) DEFAULT 10.00,
    current_wind_speed_knots INT DEFAULT 5,
    runway_closure_count INT DEFAULT 0,
    backlog_aircraft_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO airports (airport_code, airport_name, current_visibility_miles, current_wind_speed_knots, runway_closure_count, backlog_aircraft_count)
VALUES 
('JFK', 'John F. Kennedy International', 2.50, 28, 1, 18),
('LAX', 'Los Angeles International', 10.00, 4, 0, 2),
('EWR', 'Newark Liberty International', 4.00, 18, 0, 12)
ON CONFLICT (airport_code) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;
`;
