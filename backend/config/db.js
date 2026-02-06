const { Pool } = require('pg');

const pool = new Pool({
  user: 'ben',     
  host: 'localhost',
  database: 'bruin_match',
  password: '',
  port: 5432,
});

module.exports = pool;