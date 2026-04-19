const { Pool } = require('pg');
require('dotenv').config();

// A Pool beállítása úgy, hogy támogassa a helyi és a felhős környezetet is
const pool = new Pool({
  // Ha az interneten futunk, a Neon/Render egyetlen URL-t ad (connectionString)
  connectionString: process.env.DATABASE_URL,
  
  // Helyi fejlesztéshez megmaradnak a korábbi változók
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,

  // SSL beállítás: felhőben (ha van DATABASE_URL) kötelező, helyileg nem kell
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

module.exports = pool;