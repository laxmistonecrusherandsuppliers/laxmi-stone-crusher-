import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM customers';
    const params = [];

    if (search) {
      sql += ' WHERE name ILIKE $1 OR mobile ILIKE $1';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY name ASC';
    const { rows } = await query(sql, params);
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, mobile, address } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { rows } = await query(
      'INSERT INTO customers (name, mobile, address) VALUES ($1, $2, $3) RETURNING *',
      [name, mobile, address]
    );

    return NextResponse.json({ data: rows[0], message: 'Customer created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
