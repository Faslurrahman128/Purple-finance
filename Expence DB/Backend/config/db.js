import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Project-local settings must win over unrelated machine-wide DB_* variables.
dotenv.config({ override: true });

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'expense_tracker',
  port: Number(process.env.DB_PORT || 5432),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});