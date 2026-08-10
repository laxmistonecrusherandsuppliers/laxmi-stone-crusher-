const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding initial admin and staff users...');

    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const staffHash = await bcrypt.hash('staff123', salt);

    await client.query(`
      INSERT INTO users (username, mobile, password_hash, role)
      VALUES 
        ('admin', '9999999999', $1, 'admin'),
        ('staff1', '8888888888', $2, 'staff')
      ON CONFLICT (username) DO NOTHING
    `, [adminHash, staffHash]);

    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
