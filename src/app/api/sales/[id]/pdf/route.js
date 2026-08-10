import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateBillPdfBuffer } from '@/lib/pdf';

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

    const settingsRes = await query("SELECT key, value FROM settings");
    const settings = {};
    settingsRes.rows.forEach(r => settings[r.key] = r.value);

    const pdfBuffer = await generateBillPdfBuffer(sale, settings);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${sale.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
