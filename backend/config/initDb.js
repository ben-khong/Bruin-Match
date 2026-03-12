const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function initDb() {
  // Run schema.sql
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await pool.query(sql);

  // -- Migrations (dev) --------------------------------------------------------
  // Add ALTER TABLE statements here whenever schema.sql gains a new column.

}

module.exports = initDb;