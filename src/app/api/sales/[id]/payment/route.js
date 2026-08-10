import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const client = await pool.connect();
  try {
    const { id } = params;
    const body = await request.json();
    const { amount_paid, payment_method, notes } = body;

    const paymentAmount = parseFloat(amount_paid);
    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid payment amount greater than 0' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Fetch sale
    const saleRes = await client.query('SELECT * FROM sales WHERE id = $1', [id]);
    if (saleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Sale invoice not found' }, { status: 404 });
    }

    const sale = saleRes.rows[0];
    const currentDue = parseFloat(sale.amount_due) || 0;
    const currentPaid = parseFloat(sale.amount_paid) || 0;
    const grandTotal = parseFloat(sale.grand_total) || 0;

    if (paymentAmount > currentDue + 0.01) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: `Payment amount (₹${paymentAmount}) exceeds outstanding due (₹${currentDue})` }, { status: 400 });
    }

    const newPaid = currentPaid + paymentAmount;
    const newDue = Math.max(0, grandTotal - newPaid);
    const newStatus = newDue <= 0.01 ? 'full' : 'partial';

    // Update sales record
    await client.query(
      `UPDATE sales 
       SET amount_paid = $1, amount_due = $2, payment_mode = $3
       WHERE id = $4`,
      [newPaid, newDue, newStatus, id]
    );

    // Record payment log
    const payMode = payment_method || 'cash';
    const logNote = notes ? `${payMode.toUpperCase()} Payment - ${notes}` : `${payMode.toUpperCase()} Payment Settlement`;

    await client.query(
      `INSERT INTO payment_logs (sale_id, customer_id, amount_paid, balance_before, balance_after, notes, payment_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, sale.customer_id, paymentAmount, currentDue, newDue, logNote, payMode]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      message: 'Payment recorded successfully',
      data: {
        new_paid: newPaid,
        new_due: newDue,
        status: newStatus
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
