-- Database schema for Sweety – Blood Glucose Tracker

-- Users table: stores user authentication details
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Readings table: stores blood glucose measurements
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    slot VARCHAR(20) NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Safety net constraints
    CONSTRAINT valid_slot CHECK (slot IN ('morning', 'after_breakfast', 'after_lunch', 'after_dinner')),
    CONSTRAINT valid_value_range CHECK (value BETWEEN 40 AND 600),
    CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, slot)
);

-- Index for speedy queries by user and date
CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, reading_date);
