const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide identifier and password', status: 400 });
    }

    const { rows } = await db.query(
      'SELECT * FROM users WHERE (username = $1 OR mobile = $1) AND is_active = true',
      [identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account', status: 401 });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials', status: 401 });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({ data: { token, user: payload }, message: 'Login successful' });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.json({ data: req.user, message: 'Current user profile' });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Provide old and new passwords', status: 400 });
    }

    const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found', status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Old password is incorrect', status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
