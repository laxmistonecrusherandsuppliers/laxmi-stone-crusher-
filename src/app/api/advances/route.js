import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT ad.*, st.name as staff_name
      FROM advances ad
      JOIN staff st ON ad.staff_id = st.id
      ORDER BY ad.advance_date DESC, ad.id DESC
    `);
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { staff_id, amount, advance_date, notes } = await request.json();
    if (!staff_id || !amount) {
      return NextResponse.json({ error: 'Staff and amount are required' }, { status: 400 });
    }

    const { rows } = await query(
      'INSERT INTO advances (staff_id, amount, advance_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [staff_id, amount, advance_date || new Date().toISOString().split('T')[0], notes || null]
    );

    return NextResponse.json({ data: rows[0], message: 'Salary advance recorded' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
