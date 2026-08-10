import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://lsc_user:lsc_pass@localhost:5432/lsc_db';

const isCloudDb = connectionString.includes('supabase') || 
                  connectionString.includes('neon.tech') || 
                  connectionString.includes('sslmode=require') || 
                  process.env.NODE_ENV === 'production';

let pool;

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString,
    ssl: isCloudDb ? { rejectUnauthorized: false } : false,
  });
}

pool = global._pgPool;

export const query = (text, params) => pool.query(text, params);
export { pool };
