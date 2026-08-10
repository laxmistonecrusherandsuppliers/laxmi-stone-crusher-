import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

// In-memory sliding-window rate limiter for brute-force prevention
const loginAttempts = new Map();

function isRateLimited(identifier) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const key = String(identifier).toLowerCase();
  const history = loginAttempts.get(key) || [];
  const validHistory = history.filter(time => now - time < windowMs);

  if (validHistory.length >= maxAttempts) {
    return true;
  }

  validHistory.push(now);
  loginAttempts.set(key, validHistory);
  return false;
}

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Please provide identifier and password' }, { status: 400 });
    }

    const cleanIdentifier = String(identifier).trim();

    // Check brute-force rate limit
    if (isRateLimited(cleanIdentifier)) {
      return NextResponse.json({
        error: 'Too many failed login attempts. Please wait 15 minutes before trying again.'
      }, { status: 429 });
    }

    // Parameterized SQL query (100% SQL injection proof)
    const { rows } = await query(
      'SELECT id, username, password_hash, role, is_active FROM users WHERE (username = $1 OR mobile = $1) AND is_active = true',
      [cleanIdentifier]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Reset rate limiter on successful login
    loginAttempts.delete(cleanIdentifier.toLowerCase());

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'd7bf684cd39a335dc5018c655ad28e56acae639cb25b069037909d4807377d36', {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    return NextResponse.json({ data: { token, user: payload }, message: 'Login successful' });
  } catch (error) {
    return NextResponse.json({ error: 'An unexpected authentication error occurred.' }, { status: 500 });
  }
}
