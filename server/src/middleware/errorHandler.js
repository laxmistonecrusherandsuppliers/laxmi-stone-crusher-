const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    return res.status(409).json({ error: 'Duplicate record found', status: 409 });
  }

  res.status(500).json({ error: err.message || 'Internal Server Error', status: 500 });
};

module.exports = errorHandler;
