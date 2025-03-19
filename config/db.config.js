const { Pool } = require('pg');
require('dotenv').config()

const db = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432, 
    ssl: {
        rejectUnauthorized: false
    }
});

db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
    console.log("Connected to PostgreSQL at:", res.rows[0].now);
});

db.query('Select * from "Users"', (err, res) => {
    if (err) {
      console.error('Database connection failed:', err);
      process.exit(1);
    }
    console.log('Connected to PostgreSQL at:', res.rows);
  });
  
  module.exports = db;

module.exports = db;