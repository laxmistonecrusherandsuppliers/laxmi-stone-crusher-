import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT s.id, s.invoice_number, s.grand_total, s.sale_date, s.amount_paid, s.amount_due, s.payment_mode, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC LIMIT 10
    `);
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
