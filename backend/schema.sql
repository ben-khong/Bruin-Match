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

CREATE TABLE IF NOT EXISTS roommate_groups (
    id SERIAL PRIMARY KEY,
    leader_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_name VARCHAR(100) DEFAULT 'New Roommate Group',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Who is in the group
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES roommate_groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

-- The Chat messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES roommate_groups(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Group Invites
CREATE TABLE IF NOT EXISTS group_invites (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES roommate_groups(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, receiver_id) -- Prevents duplicate invites to the same person
);