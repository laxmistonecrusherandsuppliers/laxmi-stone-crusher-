import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const statsRes = await query(`
      SELECT 
        COUNT(id) as today_sales_count,
        COALESCE(SUM(grand_total), 0) as today_sales_amount
      FROM sales WHERE sale_date = $1
    `, [today]);

    const collectionRes = await query(`
      SELECT COALESCE(SUM(amount_paid), 0) as today_collection
      FROM payment_logs WHERE DATE(payment_date AT TIME ZONE 'UTC') = $1
    `, [today]);

    const outRes = await query(`SELECT COALESCE(SUM(amount_due), 0) as total_outstanding FROM sales`);
    const custRes = await query(`SELECT COUNT(id) as total_customers FROM customers`);

    return NextResponse.json({
      data: {
        today_sales_count: statsRes.rows[0].today_sales_count,
        today_sales_amount: statsRes.rows[0].today_sales_amount,
        today_collection: collectionRes.rows[0].today_collection,
        total_outstanding: outRes.rows[0].total_outstanding,
        total_customers: custRes.rows[0].total_customers
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
