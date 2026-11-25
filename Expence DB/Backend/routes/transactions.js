import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        t.*,
        COALESCE(ucs.custom_name, c.category_name) AS category_name,
        a.account_name,
        p.method_name
      FROM transactions t
      JOIN categories c
        ON c.category_id = t.category_id
      LEFT JOIN user_category_settings ucs
        ON ucs.category_id = c.category_id AND ucs.user_id = t.user_id
      JOIN accounts a
        ON a.account_id = t.account_id
      JOIN payment_methods p
        ON p.payment_method_id = t.payment_method_id
      WHERE t.user_id = $1
      ORDER BY
        t.transaction_date DESC,
        t.transaction_id DESC
    `, [req.user.user_id]);

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      account_id,
      category_id,
      payment_method_id,
      amount,
      transaction_type,
      transaction_date,
      description
    } = req.body;

    if (
      !account_id ||
      !category_id ||
      !payment_method_id ||
      !amount ||
      Number(amount) <= 0 ||
      !['Income', 'Expense'].includes(transaction_type) ||
      !transaction_date
    ) {
      return res.status(400).json({
        message: 'Please provide valid transaction details'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO transactions (
        user_id,
        account_id,
        category_id,
        payment_method_id,
        amount,
        transaction_type,
        transaction_date,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING transaction_id`,
      [
        req.user.user_id,
        account_id,
        category_id,
        payment_method_id,
        amount,
        transaction_type,
        transaction_date,
        description || ''
      ]
    );

    res.status(201).json({
      id: rows[0].transaction_id,
      message: 'Transaction created'
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      account_id,
      category_id,
      payment_method_id,
      amount,
      transaction_type,
      transaction_date,
      description
    } = req.body;

    if (
      !account_id ||
      !category_id ||
      !payment_method_id ||
      !amount ||
      Number(amount) <= 0 ||
      !['Income', 'Expense'].includes(transaction_type) ||
      !transaction_date
    ) {
      return res.status(400).json({
        message: 'Please provide valid transaction details'
      });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET
         account_id = $1,
         category_id = $2,
         payment_method_id = $3,
         amount = $4,
         transaction_type = $5,
         transaction_date = $6,
         description = $7
       WHERE transaction_id = $8 AND user_id = $9
       RETURNING transaction_id`,
      [
        account_id,
        category_id,
        payment_method_id,
        amount,
        transaction_type,
        transaction_date,
        description || '',
        req.params.id,
        req.user.user_id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Transaction not found'
      });
    }

    res.json({ message: 'Transaction updated' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM transactions
       WHERE transaction_id = $1 AND user_id = $2
       RETURNING transaction_id`,
      [req.params.id, req.user.user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Transaction not found'
      });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
