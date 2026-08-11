import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const customer_id = searchParams.get('customer_id');

    let sql = `
      SELECT s.*, c.name as customer_name, c.mobile as customer_mobile
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
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
      sql += ` AND s.customer_id = $${params.length}`;
    }

    sql += ' ORDER BY s.sale_date DESC, s.id DESC LIMIT 100';

    const { rows } = await query(sql, params);
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { customer_id, sale_date, gst_enabled, items, payment_mode, payment_method, amount_paid, notes } = body;
    const payMethod = payment_method || 'cash';

    if (!customer_id || !items || !items.length) {
      return NextResponse.json({ error: 'Customer and items are required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Fetch settings
    const settingsRes = await client.query("SELECT key, value FROM settings WHERE key IN ('invoice_prefix', 'financial_year', 'next_invoice_number', 'gst_percent')");
    const settings = {};
    settingsRes.rows.forEach(r => settings[r.key] = r.value);

    const prefix = settings.invoice_prefix || 'LSC';
    const year = settings.financial_year || '2526';
    const numStr = String(settings.next_invoice_number || '1').padStart(4, '0');
    const invoice_number = `${prefix}-${year}-${numStr}`;
    const gst_percent = parseFloat(settings.gst_percent || '18');

    let subtotal = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.quantity) * parseFloat(item.rate);
    });

    let gst_amount = 0;
    if (gst_enabled) {
      gst_amount = subtotal * (gst_percent / 100);
    }

    const grand_total = subtotal + gst_amount;

    let actual_paid = 0;
    let due = 0;

    if (payment_mode === 'full') {
      actual_paid = grand_total;
      due = 0;
    } else if (payment_mode === 'due') {
      actual_paid = 0;
      due = grand_total;
    } else {
      actual_paid = parseFloat(amount_paid) || 0;
      due = grand_total - actual_paid;
    }

    const saleRes = await client.query(
      `INSERT INTO sales (
        invoice_number, customer_id, sale_date, gst_enabled, gst_percent,
        subtotal, gst_amount, grand_total, payment_mode, amount_paid, amount_due, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [invoice_number, customer_id, sale_date || new Date(), gst_enabled || false, gst_percent,
       subtotal, gst_amount, grand_total, payment_mode, actual_paid, due, notes]
    );

    const sale_id = saleRes.rows[0].id;

    for (const item of items) {
      const amt = parseFloat(item.quantity) * parseFloat(item.rate);
      await client.query(
        `INSERT INTO sale_items (sale_id, material_id, custom_material_name, quantity, unit, rate, amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale_id, item.material_id, item.custom_material_name, item.quantity, item.unit || 'Tonne', item.rate, amt]
      );
    }

    const logNote = notes ? `Initial Payment (${payMethod.toUpperCase()}) - ${notes}` : `Initial Payment (${payMethod.toUpperCase()})`;
    await client.query(
      `INSERT INTO payment_logs (sale_id, customer_id, amount_paid, balance_before, balance_after, notes, payment_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sale_id, customer_id, actual_paid, grand_total, due, logNote, payMethod]
    );

    await client.query(
      `UPDATE settings SET value = $1 WHERE key = 'next_invoice_number'`,
      [parseInt(settings.next_invoice_number || 1) + 1]
    );

    await client.query('COMMIT');
    return NextResponse.json({ data: { sale_id, invoice_number }, message: 'Sale created successfully' }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
