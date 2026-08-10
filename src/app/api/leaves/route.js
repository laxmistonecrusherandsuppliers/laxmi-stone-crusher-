import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT lr.*, st.name as staff_name
      FROM leave_requests lr
      JOIN staff st ON lr.staff_id = st.id
      ORDER BY lr.created_at DESC
    `);
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { staff_id, from_date, to_date, type, reason } = await request.json();
    if (!staff_id || !from_date || !to_date) {
      return NextResponse.json({ error: 'Staff and date range are required' }, { status: 400 });
    }

    const { rows } = await query(
      'INSERT INTO leave_requests (staff_id, from_date, to_date, type, reason, status) VALUES ($1, $2, $3, $4, $5, \'approved\') RETURNING *',
      [staff_id, from_date, to_date, type || 'Casual', reason || null]
    );

    return NextResponse.json({ data: rows[0], message: 'Leave request recorded' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
