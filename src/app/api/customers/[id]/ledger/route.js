import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { rows: logs } = await query(
      'SELECT * FROM payment_logs WHERE customer_id = $1 ORDER BY payment_date ASC, id ASC',
      [id]
    );

    const { rows: summary } = await query(`
      SELECT 
        COALESCE(SUM(grand_total), 0) as total_billed,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(amount_due), 0) as total_due
      FROM sales WHERE customer_id = $1
    `, [id]);

    return NextResponse.json({
      data: {
        logs,
        summary: summary[0] || { total_billed: 0, total_paid: 0, total_due: 0 }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
