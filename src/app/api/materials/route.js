import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT m.id, m.name, m.is_system, m.is_active, 
             sr.rate_per_unit, sr.unit
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
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { rows } = await query(
      'INSERT INTO materials (name, is_system, is_active) VALUES ($1, false, true) RETURNING *',
      [name]
    );
    return NextResponse.json({ data: rows[0], message: 'Material created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
