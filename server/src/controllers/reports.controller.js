const db = require('../config/db');
const { generateReportPdf } = require('../services/pdf.service');

exports.daily = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let query = `
      SELECT sale_date, 
             COUNT(id) as count, 
             SUM(grand_total) as total_amount, 
             SUM(amount_paid) as total_paid, 
             SUM(amount_due) as total_due
      FROM sales 
      WHERE 1=1
    `;
    const params = [];
    if (from) { params.push(from); query += ` AND sale_date >= $${params.length}`; }
    if (to) { params.push(to); query += ` AND sale_date <= $${params.length}`; }
    
    query += ' GROUP BY sale_date ORDER BY sale_date DESC';
    const { rows } = await db.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};

exports.customerWise = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let query = `
      SELECT c.name, 
             COUNT(s.id) as count, 
             SUM(s.grand_total) as total_amount, 
             SUM(s.amount_paid) as total_paid, 
             SUM(s.amount_due) as total_due
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (from) { params.push(from); query += ` AND s.sale_date >= $${params.length}`; }
    if (to) { params.push(to); query += ` AND s.sale_date <= $${params.length}`; }
    
    query += ' GROUP BY c.id, c.name ORDER BY total_amount DESC';
    const { rows } = await db.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};

exports.materialWise = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let query = `
      SELECT m.name, 
             SUM(si.quantity) as total_qty, 
             AVG(si.rate) as avg_rate, 
             SUM(si.amount) as total_amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN materials m ON si.material_id = m.id
      WHERE 1=1
    `;
    const params = [];
    if (from) { params.push(from); query += ` AND s.sale_date >= $${params.length}`; }
    if (to) { params.push(to); query += ` AND s.sale_date <= $${params.length}`; }
    
    query += ' GROUP BY m.id, m.name ORDER BY total_amount DESC';
    const { rows } = await db.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};

exports.dueReport = async (req, res, next) => {
  try {
    const { as_of } = req.query;
    let query = `
      SELECT s.id, s.invoice_number, s.sale_date, s.grand_total, s.amount_paid, s.amount_due,
             c.name as customer_name, c.mobile as customer_mobile
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.amount_due > 0
    `;
    const params = [];
    if (as_of) { params.push(as_of); query += ` AND s.sale_date <= $${params.length}`; }
    
    query += ' ORDER BY s.amount_due DESC';
    const { rows } = await db.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getPdf = async (req, res, next) => {
  try {
    const { type, from, to, as_of } = req.query;

    // Fetch settings
    const settingsRes = await db.query("SELECT key, value FROM settings");
    const settings = {};
    settingsRes.rows.forEach(r => settings[r.key] = r.value);

    // Build date params helper
    const buildDateParams = (baseQuery, params) => {
      let q = baseQuery;
      if (from) { params.push(from); q += ` AND sale_date >= $${params.length}`; }
      if (to)   { params.push(to);   q += ` AND sale_date <= $${params.length}`; }
      return q;
    };

    let items = [];
    let summary = {};

    if (type === 'daily') {
      const params = [];
      let q = buildDateParams('SELECT sale_date, COUNT(id) as count, SUM(grand_total) as total_amount, SUM(amount_paid) as total_paid, SUM(amount_due) as total_due FROM sales WHERE 1=1', params);
      q += ' GROUP BY sale_date ORDER BY sale_date DESC';
      const { rows } = await db.query(q, params);
      items = rows;
      const totals = rows.reduce((acc, r) => {
        acc.total_count  += parseInt(r.count) || 0;
        acc.total_amount += parseFloat(r.total_amount) || 0;
        acc.total_paid   += parseFloat(r.total_paid)   || 0;
        acc.total_due    += parseFloat(r.total_due)    || 0;
        return acc;
      }, { total_count: 0, total_amount: 0, total_paid: 0, total_due: 0 });
      summary = totals;

    } else if (type === 'customer-wise') {
      const params = [];
      let q = buildDateParams('SELECT c.name, COUNT(s.id) as count, SUM(s.grand_total) as total_amount, SUM(s.amount_paid) as total_paid, SUM(s.amount_due) as total_due FROM sales s JOIN customers c ON s.customer_id = c.id WHERE 1=1', params);
      q += ' GROUP BY c.id, c.name ORDER BY total_amount DESC';
      const { rows } = await db.query(q, params);
      items = rows;
      const totals = rows.reduce((acc, r) => {
        acc.total_count  += parseInt(r.count) || 0;
        acc.total_amount += parseFloat(r.total_amount) || 0;
        acc.total_paid   += parseFloat(r.total_paid)   || 0;
        acc.total_due    += parseFloat(r.total_due)    || 0;
        return acc;
      }, { total_count: 0, total_amount: 0, total_paid: 0, total_due: 0 });
      summary = totals;

    } else if (type === 'material-wise') {
      const params = [];
      let q = 'SELECT m.name, SUM(si.quantity) as total_qty, AVG(si.rate) as avg_rate, SUM(si.amount) as total_amount FROM sale_items si JOIN sales s ON si.sale_id = s.id JOIN materials m ON si.material_id = m.id WHERE 1=1';
      if (from) { params.push(from); q += ` AND s.sale_date >= $${params.length}`; }
      if (to)   { params.push(to);   q += ` AND s.sale_date <= $${params.length}`; }
      q += ' GROUP BY m.id, m.name ORDER BY total_amount DESC';
      const { rows } = await db.query(q, params);
      items = rows;
      const totals = rows.reduce((acc, r) => {
        acc.total_amount += parseFloat(r.total_amount) || 0;
        return acc;
      }, { total_amount: 0 });
      summary = totals;

    } else if (type === 'due') {
      const params = [];
      let q = 'SELECT s.id, s.invoice_number, s.sale_date, s.grand_total, s.amount_paid, s.amount_due, c.name as customer_name, c.mobile as customer_mobile FROM sales s JOIN customers c ON s.customer_id = c.id WHERE s.amount_due > 0';
      if (as_of) { params.push(as_of); q += ` AND s.sale_date <= $${params.length}`; }
      q += ' ORDER BY s.amount_due DESC';
      const { rows } = await db.query(q, params);
      items = rows;
      const totals = rows.reduce((acc, r) => {
        acc.total_amount += parseFloat(r.grand_total)  || 0;
        acc.total_paid   += parseFloat(r.amount_paid)  || 0;
        acc.total_due    += parseFloat(r.amount_due)   || 0;
        return acc;
      }, { total_amount: 0, total_paid: 0, total_due: 0 });
      summary = totals;
    }

    const doc = generateReportPdf({ items, summary }, type, { from, to }, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="report-${type}-${from || 'all'}-${to || 'all'}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    next(error);
  }
};
