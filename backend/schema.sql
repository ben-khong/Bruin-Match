-- Users table (authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profiles table (basic info + contact)
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  year VARCHAR(20),
  major VARCHAR(100),
  gender VARCHAR(50),
  bio TEXT,
  contact_info VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Housing Preferences table (for filtering)
CREATE TABLE housing_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  housing_type VARCHAR(50),
  room_type VARCHAR(50),
  move_in_term VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);