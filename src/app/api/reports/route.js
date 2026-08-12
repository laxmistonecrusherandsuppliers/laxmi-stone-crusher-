import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const customer_id = searchParams.get('customer_id');

    if (type === 'customer-statement') {
      let sql = `
        SELECT s.id as sale_id, s.invoice_number, s.sale_date, s.payment_mode, s.amount_paid, s.amount_due, s.grand_total,
               c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address,
               si.id as item_id, COALESCE(si.custom_material_name, m.name, 'Material Item') as material_name,
               si.quantity, si.unit, si.rate, si.amount as item_amount
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN materials m ON si.material_id = m.id
        WHERE 1=1
      `;
      const params = [];

      if (customer_id) {
        params.push(customer_id);
        sql += ` AND c.id = $${params.length}`;
      }
      if (from) {
        params.push(from);
        sql += ` AND s.sale_date >= $${params.length}`;
      }
      if (to) {
        params.push(to);
        sql += ` AND s.sale_date <= $${params.length}`;
      }

      sql += ' ORDER BY s.sale_date DESC, s.id DESC, si.id ASC';

      const { rows } = await query(sql, params);
      return NextResponse.json({ data: rows });
    }

    if (type === 'customer-wise') {
      let sql = `
        SELECT c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile,
               COUNT(s.id) as total_orders,
               COALESCE(SUM(s.grand_total), 0) as total_billed,
               COALESCE(SUM(s.amount_paid), 0) as total_paid,
               COALESCE(SUM(s.amount_due), 0) as total_due
        FROM customers c
        JOIN sales s ON c.id = s.customer_id
        WHERE 1=1
      `;
      const params = [];

      if (from) {
        params.push(from);
        sql += ` AND s.sale_date >= $${params.length}`;
      }
      if (to) {
        params.push(to);
        sql += ` AND s.sale_date <= $${params.length}`;
      }
      if (customer_id) {
        params.push(customer_id);
        sql += ` AND c.id = $${params.length}`;
      }

      sql += ' GROUP BY c.id, c.name, c.mobile ORDER BY total_billed DESC';

      const { rows } = await query(sql, params);
      return NextResponse.json({ data: rows });
    }

    if (type === 'material-wise') {
      let sql = `
        SELECT m.id as material_id,
               COALESCE(si.custom_material_name, m.name) as material_name,
               SUM(si.quantity) as total_quantity,
               si.unit,
               AVG(si.rate) as avg_rate,
               SUM(si.amount) as total_amount
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        LEFT JOIN materials m ON si.material_id = m.id
        WHERE 1=1
      `;
      const params = [];

      if (from) {
        params.push(from);
        sql += ` AND s.sale_date >= $${params.length}`;
      }
      if (to) {
        params.push(to);
        sql += ` AND s.sale_date <= $${params.length}`;
      }

      sql += ' GROUP BY m.id, material_name, si.unit ORDER BY total_amount DESC';

      const { rows } = await query(sql, params);
      return NextResponse.json({ data: rows });
    }

    if (type === 'due') {
      let sql = `
        SELECT s.id, s.invoice_number, s.sale_date, s.grand_total, s.amount_paid, s.amount_due,
               c.name as customer_name, c.mobile as customer_mobile
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.amount_due > 0
      `;
      const params = [];
      if (from) {
        params.push(from);
        sql += ` AND s.sale_date >= $${params.length}`;
      }
      if (to) {
        params.push(to);
        sql += ` AND s.sale_date <= $${params.length}`;
      }

      sql += ' ORDER BY s.amount_due DESC';

      const { rows } = await query(sql, params);
      return NextResponse.json({ data: rows });
    }

    // Default: Daily Sales Report
    let sql = `
      SELECT s.sale_date,
             COUNT(s.id) as total_orders,
             COALESCE(SUM(s.grand_total), 0) as total_billed,
             COALESCE(SUM(s.amount_paid), 0) as total_paid,
             COALESCE(SUM(s.amount_due), 0) as total_due
      FROM sales s
      WHERE 1=1
    `;
    const params = [];

    if (from) {
      params.push(from);
      sql += ` AND s.sale_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      sql += ` AND s.sale_date <= $${params.length}`;
    }

    sql += ' GROUP BY s.sale_date ORDER BY s.sale_date DESC';

    const { rows } = await query(sql, params);
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
