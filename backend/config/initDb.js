const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function initDb() {
  // Run schema.sql
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await pool.query(sql);

  // -- Migrations -------------------------------------------------------------
  // Add ALTER TABLE statements here whenever schema.sql gains a new column.

  // users: username didn't exist originally
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username VARCHAR(50);
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
      ON users (username);
  `);

  // user_preferences: columns added in the 10-question survey update
  await pool.query(`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS cleanliness_level VARCHAR(120)
        NOT NULL DEFAULT 'Tidy - I clean a few times a week';
  `);
  await pool.query(`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS overnight_guest_frequency VARCHAR(120)
        NOT NULL DEFAULT 'Rarely (once a month or less)';
  `);
  await pool.query(`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS sharing_style VARCHAR(150)
        NOT NULL DEFAULT 'Fine sharing some things if asked';
  `);
  await pool.query(`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS social_energy VARCHAR(100)
        NOT NULL DEFAULT 'Cordial - we coexist respectfully';
  `);
  await pool.query(`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS conflict_style VARCHAR(120)
        NOT NULL DEFAULT 'I bring it up calmly after thinking it over';
  `);
}

module.exports = initDb;