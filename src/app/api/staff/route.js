import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM staff WHERE status = \'active\' ORDER BY name ASC');
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, mobile, joining_date, salary } = await request.json();
    if (!name) return NextResponse.json({ error: 'Staff name is required' }, { status: 400 });

    const { rows } = await query(
      'INSERT INTO staff (name, mobile, joining_date, salary, status) VALUES ($1, $2, $3, $4, \'active\') RETURNING *',
      [name, mobile || null, joining_date || new Date().toISOString().split('T')[0], salary || 0]
    );

    return NextResponse.json({ data: rows[0], message: 'Staff created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
