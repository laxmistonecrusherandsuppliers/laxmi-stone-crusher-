import { Pool } from 'pg';

export function getPool() {
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres.ibhgxgvxxfqxtoavofef:ZnBUG%2Ap%40w%24zgH8C@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

  const isCloudDb = connectionString.includes('supabase') || 
                    connectionString.includes('neon.tech') || 
                    connectionString.includes('sslmode=require') || 
                    process.env.NODE_ENV === 'production';

  if (!global._pgPool || global._pgConnectionString !== connectionString) {
    global._pgConnectionString = connectionString;
    global._pgPool = new Pool({
      connectionString,
      ssl: isCloudDb ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return global._pgPool;
}

export const query = (text, params) => getPool().query(text, params);
export const pool = {
  connect: () => getPool().connect(),
  query: (text, params) => getPool().query(text, params),
};
