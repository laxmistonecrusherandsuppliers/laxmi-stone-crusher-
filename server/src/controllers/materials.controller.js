const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const query = `
      SELECT m.id, m.name, m.is_system, m.is_active, 
             sr.rate_per_unit, sr.unit
      FROM materials m
      LEFT JOIN saved_rates sr ON m.id = sr.material_id
      WHERE m.is_active = true
      ORDER BY m.id ASC
    `;
    const { rows } = await db.query(query);
    res.json({ data: rows, message: 'Materials fetched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { rows } = await db.query(
      'INSERT INTO materials (name, is_system, is_active) VALUES ($1, false, true) RETURNING *',
      [name]
    );
    res.status(201).json({ data: rows[0], message: 'Material created successfully' });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const { rows } = await db.query(
      'UPDATE materials SET name = COALESCE($1, name), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *',
      [name, is_active, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Material not found' });
    res.json({ data: rows[0], message: 'Material updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getSavedRates = async (req, res, next) => {
  try {
    const query = `
      SELECT m.id as material_id, m.name, m.is_system, sr.rate_per_unit, sr.unit
      FROM materials m
      LEFT JOIN saved_rates sr ON m.id = sr.material_id
      WHERE m.is_active = true
      ORDER BY m.id ASC
    `;
    const { rows } = await db.query(query);
    res.json({ data: rows, message: 'Rates fetched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateRate = async (req, res, next) => {
  try {
    const { material_id } = req.params;
    const { rate_per_unit, unit } = req.body;

    if (rate_per_unit === undefined) return res.status(400).json({ error: 'Rate is required' });

    const { rows } = await db.query(
      `INSERT INTO saved_rates (material_id, rate_per_unit, unit, updated_at) 
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (material_id) 
       DO UPDATE SET rate_per_unit = EXCLUDED.rate_per_unit, unit = EXCLUDED.unit, updated_at = NOW() RETURNING *`,
      [material_id, rate_per_unit, unit || 'Tonne']
    );

    res.json({ data: rows[0], message: 'Rate updated successfully' });
  } catch (error) {
    next(error);
  }
};
