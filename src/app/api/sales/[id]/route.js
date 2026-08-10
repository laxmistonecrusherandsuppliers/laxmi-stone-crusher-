import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const saleRes = await query(`
      SELECT s.*, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address
      FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = $1
    `, [id]);

    if (saleRes.rows.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const sale = saleRes.rows[0];

    const itemsRes = await query(`
      SELECT si.*, m.name as material_name 
      FROM sale_items si LEFT JOIN materials m ON si.material_id = m.id WHERE si.sale_id = $1
    `, [id]);
    sale.items = itemsRes.rows;

    const logsRes = await query(`SELECT * FROM payment_logs WHERE sale_id = $1 ORDER BY payment_date ASC`, [id]);
    sale.payment_logs = logsRes.rows;

    return NextResponse.json({ data: sale });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
