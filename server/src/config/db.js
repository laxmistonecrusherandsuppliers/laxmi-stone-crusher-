const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const isCloudDb = connectionString?.includes('neon.tech') || 
                  connectionString?.includes('supabase') || 
                  connectionString?.includes('render.com') ||
                  connectionString?.includes('sslmode=require') ||
                  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
