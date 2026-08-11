import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

export async function DELETE(request, { params }) {
  const client = await pool.connect();
  try {
    const { id } = params;

    await client.query('BEGIN');

    // Delete sale items & payment logs first
    await client.query('DELETE FROM sale_items WHERE sale_id = $1', [id]);
    await client.query('DELETE FROM payment_logs WHERE sale_id = $1', [id]);

    // Delete sale bill record
    const result = await client.query('DELETE FROM sales WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Invoice bill not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Sale invoice deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
