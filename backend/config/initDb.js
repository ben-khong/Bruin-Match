const pool = require('./db');

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Backward-compatible migration for existing databases.
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username VARCHAR(50);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
    ON users (username);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS match_requests (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (requester_id, recipient_id)
    );
  `);

  await pool.query(`
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
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      sleep_time VARCHAR(100) NOT NULL,
      wake_time VARCHAR(100) NOT NULL,
      thermostat_temp VARCHAR(100) NOT NULL,
      guest_policy VARCHAR(100) NOT NULL,
      noise_tolerance VARCHAR(100) NOT NULL,
      cleanliness_level VARCHAR(120) NOT NULL DEFAULT 'Tidy - I clean a few times a week',
      overnight_guest_frequency VARCHAR(120) NOT NULL DEFAULT 'Rarely (once a month or less)',
      sharing_style VARCHAR(150) NOT NULL DEFAULT 'Fine sharing some things if asked',
      social_energy VARCHAR(100) NOT NULL DEFAULT 'Cordial - we coexist respectfully',
      conflict_style VARCHAR(120) NOT NULL DEFAULT 'I bring it up calmly after thinking it over',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id)
    );
  `);

  // Backward-compatible migration for databases created before the latest 10-question survey.
  await pool.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS cleanliness_level VARCHAR(120) NOT NULL DEFAULT 'Tidy - I clean a few times a week';
  `);
  await pool.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS overnight_guest_frequency VARCHAR(120) NOT NULL DEFAULT 'Rarely (once a month or less)';
  `);
  await pool.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS sharing_style VARCHAR(150) NOT NULL DEFAULT 'Fine sharing some things if asked';
  `);
  await pool.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS social_energy VARCHAR(100) NOT NULL DEFAULT 'Cordial - we coexist respectfully';
  `);
  await pool.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS conflict_style VARCHAR(120) NOT NULL DEFAULT 'I bring it up calmly after thinking it over';
  `);

}

module.exports = initDb;
