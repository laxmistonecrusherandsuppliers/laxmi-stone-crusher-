import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, mobile, address } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const { rows } = await query(
      'UPDATE customers SET name = $1, mobile = $2, address = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name.trim(), mobile || null, address || null, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0], message: 'Customer updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    // Check if customer has sales
    const salesCheck = await query('SELECT COUNT(*) FROM sales WHERE customer_id = $1', [id]);
    if (parseInt(salesCheck.rows[0].count) > 0) {
      return NextResponse.json({
        error: 'Cannot delete customer with existing sales records. Remove or reassign sales first.'
      }, { status: 400 });
    }

    await query('DELETE FROM customers WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
