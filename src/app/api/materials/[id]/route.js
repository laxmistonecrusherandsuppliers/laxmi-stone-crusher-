import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const client = await pool.connect();
  try {
    const { id } = params;
    const { name, rate_per_unit, unit } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Material name is required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Update material name
    await client.query('UPDATE materials SET name = $1 WHERE id = $2', [name.trim(), id]);

    // Update or insert saved rate
    if (rate_per_unit !== undefined && rate_per_unit !== null) {
      await client.query(`
        INSERT INTO saved_rates (material_id, rate_per_unit, unit, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (material_id) DO UPDATE
        SET rate_per_unit = EXCLUDED.rate_per_unit,
            unit = EXCLUDED.unit,
            updated_at = NOW()
      `, [id, parseFloat(rate_per_unit) || 0, unit || 'Tonne']);
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Material updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    // Soft delete material by setting is_active = false
    await query('UPDATE materials SET is_active = false WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Material removed successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
