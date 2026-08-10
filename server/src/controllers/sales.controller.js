const db = require('../config/db');
const { generateBillPdf } = require('../services/pdf.service');

exports.list = async (req, res, next) => {
  try {
    const { from, to, customer_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, c.name as customer_name, c.mobile as customer_mobile
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (from) {
      query += ` AND s.sale_date >= $${paramCount++}`;
      params.push(from);
    }
    if (to) {
      query += ` AND s.sale_date <= $${paramCount++}`;
      params.push(to);
    }
    if (customer_id) {
      query += ` AND s.customer_id = $${paramCount++}`;
      params.push(customer_id);
    }

    query += ` ORDER BY s.sale_date DESC, s.id DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    // Get count for pagination
    let countQuery = 'SELECT COUNT(*) FROM sales WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;
    if (from) { countQuery += ` AND sale_date >= $${countParamCount++}`; countParams.push(from); }
    if (to) { countQuery += ` AND sale_date <= $${countParamCount++}`; countParams.push(to); }
    if (customer_id) { countQuery += ` AND customer_id = $${countParamCount++}`; countParams.push(customer_id); }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: rows,
      pagination: { total, page: Number(page), limit: Number(limit) },
      message: 'Sales fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const {
      customer_id, sale_date, gst_enabled,
      items, payment_mode, amount_paid, notes
    } = req.body;
    
    if (!customer_id || !items || !items.length) {
      return res.status(400).json({ error: 'Customer and items are required' });
    }

    // Get settings
    const settingsRes = await client.query("SELECT key, value FROM settings WHERE key IN ('invoice_prefix', 'financial_year', 'next_invoice_number', 'gst_percent')");
    const settings = {};
    settingsRes.rows.forEach(r => settings[r.key] = r.value);
    
    const prefix = settings.invoice_prefix || 'LSC';
    const year = settings.financial_year || '2526';
    const numStr = String(settings.next_invoice_number || '1').padStart(4, '0');
    const invoice_number = `${prefix}-${year}-${numStr}`;
    const gst_percent = parseFloat(settings.gst_percent || '18');

    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.quantity) * parseFloat(item.rate);
    });
    
    let gst_amount = 0;
    if (gst_enabled) {
      gst_amount = subtotal * (gst_percent / 100);
    }
    
    const grand_total = subtotal + gst_amount;
    
    let actual_amount_paid = 0;
    let amount_due = 0;
    
    if (payment_mode === 'full') {
      actual_amount_paid = grand_total;
      amount_due = 0;
    } else if (payment_mode === 'due') {
      actual_amount_paid = 0;
      amount_due = grand_total;
    } else {
      actual_amount_paid = parseFloat(amount_paid) || 0;
      amount_due = grand_total - actual_amount_paid;
    }

    // Insert sale
    const saleRes = await client.query(
      `INSERT INTO sales (
        invoice_number, customer_id, sale_date, gst_enabled, gst_percent,
        subtotal, gst_amount, grand_total, payment_mode, amount_paid, amount_due, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [invoice_number, customer_id, sale_date || new Date(), gst_enabled || false, gst_percent,
       subtotal, gst_amount, grand_total, payment_mode, actual_amount_paid, amount_due, notes, req.user.id]
    );
    const sale_id = saleRes.rows[0].id;

    // Insert items
    for (const item of items) {
      const amount = parseFloat(item.quantity) * parseFloat(item.rate);
      await client.query(
        `INSERT INTO sale_items (sale_id, material_id, custom_material_name, quantity, unit, rate, amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale_id, item.material_id, item.custom_material_name, item.quantity, item.unit || 'Tonne', item.rate, amount]
      );
    }

    // Insert initial payment log
    await client.query(
      `INSERT INTO payment_logs (sale_id, customer_id, amount_paid, balance_before, balance_after, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sale_id, customer_id, actual_amount_paid, grand_total, amount_due, 'Initial bill payment', req.user.id]
    );

    // Update settings next number
    await client.query(
      `UPDATE settings SET value = $1 WHERE key = 'next_invoice_number'`,
      [parseInt(settings.next_invoice_number || 1) + 1]
    );

    await client.query('COMMIT');
    res.status(201).json({ data: { sale_id, invoice_number }, message: 'Sale created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Fetch Sale
    const saleRes = await db.query(`
      SELECT s.*, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address
      FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = $1
    `, [id]);
    if (saleRes.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    const sale = saleRes.rows[0];

    // Fetch Items
    const itemsRes = await db.query(`
      SELECT si.*, m.name as material_name 
      FROM sale_items si LEFT JOIN materials m ON si.material_id = m.id WHERE si.sale_id = $1
    `, [id]);
    sale.items = itemsRes.rows;

    // Fetch payment logs
    const logsRes = await db.query(`SELECT * FROM payment_logs WHERE sale_id = $1 ORDER BY payment_date ASC`, [id]);
    sale.payment_logs = logsRes.rows;

    res.json({ data: sale, message: 'Sale fetched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const saleRes = await db.query(`
      SELECT s.*, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address
      FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = $1
    `, [id]);
    if (saleRes.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    const sale = saleRes.rows[0];

    const itemsRes = await db.query(`
      SELECT si.*, m.name as material_name 
      FROM sale_items si LEFT JOIN materials m ON si.material_id = m.id WHERE si.sale_id = $1
    `, [id]);
    sale.items = itemsRes.rows;

    const settingsRes = await db.query("SELECT key, value FROM settings");
    const settings = {};
    settingsRes.rows.forEach(r => settings[r.key] = r.value);

    const doc = generateBillPdf(sale, settings);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${sale.invoice_number}.pdf"`);
    doc.pipe(res);
    doc.end();

  } catch (error) {
    next(error);
  }
};

exports.addPayment = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { amount_paid, notes } = req.body;
    if (!amount_paid || amount_paid <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    await client.query('BEGIN');
    const saleRes = await client.query('SELECT * FROM sales WHERE id = $1 FOR UPDATE', [id]);
    if (saleRes.rows.length === 0) throw new Error('Sale not found');
    const sale = saleRes.rows[0];

    const payAmt = parseFloat(amount_paid);
    const balanceBefore = parseFloat(sale.amount_due);
    
    if (payAmt > balanceBefore) {
      throw new Error('Payment amount exceeds amount due');
    }

    const balanceAfter = balanceBefore - payAmt;
    const totalPaid = parseFloat(sale.amount_paid) + payAmt;
    
    let newPaymentMode = sale.payment_mode;
    if (balanceAfter === 0) newPaymentMode = 'full';
    else if (totalPaid > 0) newPaymentMode = 'partial';

    await client.query(`
      UPDATE sales SET amount_paid = $1, amount_due = $2, payment_mode = $3 WHERE id = $4
    `, [totalPaid, balanceAfter, newPaymentMode, id]);

    await client.query(`
      INSERT INTO payment_logs (sale_id, customer_id, amount_paid, balance_before, balance_after, notes, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, sale.customer_id, payAmt, balanceBefore, balanceAfter, notes, req.user.id]);

    await client.query('COMMIT');
    res.json({ message: 'Payment recorded successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRes = await db.query(`
      SELECT 
        COUNT(id) as today_sales_count,
        COALESCE(SUM(grand_total), 0) as today_sales_amount
      FROM sales WHERE sale_date = $1
    `, [today]);

    const collectionRes = await db.query(`
      SELECT COALESCE(SUM(amount_paid), 0) as today_collection
      FROM payment_logs WHERE DATE(payment_date AT TIME ZONE 'UTC') = $1
    `, [today]);

    const outRes = await db.query(`SELECT COALESCE(SUM(amount_due), 0) as total_outstanding FROM sales`);
    const custRes = await db.query(`SELECT COUNT(id) as total_customers FROM customers`);

    res.json({
      data: {
        today_sales_count: statsRes.rows[0].today_sales_count,
        today_sales_amount: statsRes.rows[0].today_sales_amount,
        today_collection: collectionRes.rows[0].today_collection,
        total_outstanding: outRes.rows[0].total_outstanding,
        total_customers: custRes.rows[0].total_customers
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentSales = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT s.id, s.invoice_number, s.grand_total, s.sale_date, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC LIMIT 10
    `);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};
