const { Pool } = require('pg');
require('dotenv').config();

// Létrehozunk egy kapcsolat-medencét (Pool)
const pool = new Pool({
  // helyi adatbázis kapcsolati adatok (kikapcsolva)
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,

  // Render felhős adatbázis kapcsolati adatok:
  /*connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }*/
});

module.exports = pool;