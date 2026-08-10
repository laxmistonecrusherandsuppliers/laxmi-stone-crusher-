const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT key, value FROM settings');
    const settingsObj = {};
    rows.forEach(row => {
      settingsObj[row.key] = row.value;
    });
    res.json({ data: settingsObj, message: 'Settings fetched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateAll = async (req, res, next) => {
  try {
    const settings = req.body;
    
    if (typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload', status: 400 });
    }

    await db.query('BEGIN');
    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO settings (key, value, updated_at) 
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
    }
    await db.query('COMMIT');
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};
