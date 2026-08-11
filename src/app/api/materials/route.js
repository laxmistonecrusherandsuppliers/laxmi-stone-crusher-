import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = `
      SELECT m.id, m.name, m.is_system, m.is_active, 
             COALESCE(sr.rate_per_unit, 0) as rate_per_unit, 
             COALESCE(sr.unit, 'Tonne') as unit
      FROM materials m
      LEFT JOIN saved_rates sr ON m.id = sr.material_id
      WHERE m.is_active = true
      ORDER BY m.id ASC
    `;
    const { rows } = await query(sql);
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await pool.connect();
  try {
    const { name, rate_per_unit, unit } = await request.json();
    if (!name || !name.trim()) return NextResponse.json({ error: 'Material name is required' }, { status: 400 });

    await client.query('BEGIN');

    const matRes = await client.query(
      'INSERT INTO materials (name, is_system, is_active) VALUES ($1, false, true) RETURNING *',
      [name.trim()]
    );
    const material = matRes.rows[0];

    if (rate_per_unit) {
      await client.query(`
        INSERT INTO saved_rates (material_id, rate_per_unit, unit)
        VALUES ($1, $2, $3)
      `, [material.id, parseFloat(rate_per_unit) || 0, unit || 'Tonne']);
    }

    await client.query('COMMIT');

    return NextResponse.json({ data: material, message: 'Material created successfully' }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
