const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers';
    const params = [];

    if (search) {
      query += ' WHERE name ILIKE $1 OR mobile ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY name ASC';
    const { rows } = await db.query(query, params);
    res.json({ data: rows, message: 'Customers fetched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, mobile, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { rows } = await db.query(
      'INSERT INTO customers (name, mobile, address) VALUES ($1, $2, $3) RETURNING *',
      [name, mobile, address]
    );
    res.status(201).json({ data: rows[0], message: 'Customer created successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ data: rows[0], message: 'Customer fetched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, mobile, address } = req.body;

    const { rows } = await db.query(
      'UPDATE customers SET name = COALESCE($1, name), mobile = COALESCE($2, mobile), address = COALESCE($3, address), updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, mobile, address, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ data: rows[0], message: 'Customer updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check sales
    const sales = await db.query('SELECT id FROM sales WHERE customer_id = $1 LIMIT 1', [id]);
    if (sales.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with existing sales' });
    }

    const { rows } = await db.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getSales = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    let query = 'SELECT * FROM sales WHERE customer_id = $1';
    const params = [id];
    let paramCount = 1;

    if (from) {
      paramCount++;
      query += ` AND sale_date >= $${paramCount}`;
      params.push(from);
    }
    if (to) {
      paramCount++;
      query += ` AND sale_date <= $${paramCount}`;
      params.push(to);
    }
    query += ' ORDER BY sale_date DESC, id DESC';

    const { rows: salesRows } = await db.query(query, params);

    // Fetch sale items for these sales
    if (salesRows.length > 0) {
      const saleIds = salesRows.map(s => s.id);
      const itemsQuery = `
        SELECT si.*, m.name as material_name 
        FROM sale_items si
        LEFT JOIN materials m ON si.material_id = m.id
        WHERE si.sale_id = ANY($1::int[])
      `;
      const { rows: itemRows } = await db.query(itemsQuery, [saleIds]);
      
      salesRows.forEach(sale => {
        sale.items = itemRows.filter(i => i.sale_id === sale.id);
      });
    }

    res.json({ data: salesRows, message: 'Customer sales fetched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getLedger = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: logs } = await db.query(
      'SELECT * FROM payment_logs WHERE customer_id = $1 ORDER BY payment_date ASC, id ASC',
      [id]
    );

    const { rows: summary } = await db.query(`
      SELECT 
        COALESCE(SUM(grand_total), 0) as total_billed,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(amount_due), 0) as total_due
      FROM sales WHERE customer_id = $1
    `, [id]);

    res.json({ 
      data: {
        logs,
        summary: summary[0] || { total_billed: 0, total_paid: 0, total_due: 0 }
      },
      message: 'Customer ledger fetched successfully' 
    });
  } catch (error) {
    next(error);
  }
};
