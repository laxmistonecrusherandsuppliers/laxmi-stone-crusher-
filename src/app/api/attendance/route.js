import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const { rows } = await query(`
      SELECT st.id, st.name, st.mobile,
             COALESCE(a.status, 'present') as status,
             a.notes
      FROM staff st
      LEFT JOIN attendance a ON st.id = a.staff_id AND a.date = $1
      WHERE st.status = 'active'
      ORDER BY st.name ASC
    `, [date]);

    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { staff_id, date, status, notes } = await request.json();
    if (!staff_id || !date) {
      return NextResponse.json({ error: 'staff_id and date are required' }, { status: 400 });
    }

    await query(`
      INSERT INTO attendance (staff_id, date, status, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (staff_id, date) DO UPDATE
      SET status = EXCLUDED.status, notes = EXCLUDED.notes
    `, [staff_id, date, status || 'present', notes || null]);

    return NextResponse.json({ message: 'Attendance recorded' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
