import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import crudRouter from './routes/crud.js';
import transactionsRouter from './routes/transactions.js';
import notificationsRouter from './routes/notifications.js';
import authRouter from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config({ override: true });

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      ok: true,
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: 'disconnected',
      message: error.message
    });
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    database: process.env.DB_NAME || 'expense_tracker',
    port: Number(process.env.PORT || 5000),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/transactions', requireAuth, transactionsRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api', requireAuth, crudRouter);

app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: 'API endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('API Error:', err);

  let message = 'The server could not complete this request.';

  if (err.code === 'ECONNREFUSED') {
    message = 'Database connection refused. Start PostgreSQL and try again.';
  } else if (err.code === '3D000') {
    message = 'Database not found. Import Database/schema-postgresql.sql first.';
  } else if (err.code === '28P01') {
    message = 'Database login failed. Check the Backend/.env credentials.';
  } else if (err.code === '23505') {
    message = 'That record already exists.';
  } else if (err.code === '23503') {
    message = 'This operation conflicts with a related database record.';
  } else if (err.code === '23514') {
    message = 'The supplied value does not meet the database requirements.';
  } else if (err.code === '22P02') {
    message = 'One or more supplied values have an invalid format.';
  } else if (err.status && err.status < 500) {
    message = err.message;
  }

  res.status(err.status || 500).json({
    message,
    code: err.code || 'SERVER_ERROR'
  });
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
