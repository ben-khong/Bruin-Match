-- Users table (authentication only)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile info (displayed on browse cards, used for filtering)
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  major VARCHAR(100) NOT NULL,
  gender VARCHAR(50) NOT NULL,
  contact_info VARCHAR(255) NOT NULL,
  housing_type VARCHAR(50) NOT NULL,
  room_type VARCHAR(100) NOT NULL,
  move_in_term VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lifestyle preferences (shown on full profile view)
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  sleep_time VARCHAR(100) NOT NULL,
  wake_time VARCHAR(100) NOT NULL,
  cleanliness_level VARCHAR(120) NOT NULL,
  overnight_guest_frequency VARCHAR(120) NOT NULL,
  sharing_style VARCHAR(150) NOT NULL,
  noise_tolerance VARCHAR(150) NOT NULL,
  thermostat_temp VARCHAR(100) NOT NULL,
  guest_policy VARCHAR(100) NOT NULL,
  social_energy VARCHAR(100) NOT NULL,
  conflict_style VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match requests between users
CREATE TABLE IF NOT EXISTS match_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (requester_id, recipient_id)
);

-- Roommate groups
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group membership (one active group per user)
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id)
);

-- Saved filter presets per user (FR-9)
CREATE TABLE IF NOT EXISTS saved_filters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications for request events (FR-10)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);