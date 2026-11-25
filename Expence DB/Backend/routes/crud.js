import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

const configs = {
  accounts: {
    table: 'accounts',
    id: 'account_id',
    columns: ['user_id', 'account_name', 'account_type', 'current_balance']
  },
  categories: {
    table: 'categories',
    id: 'category_id',
    columns: ['user_id', 'category_name'],
    sharedDefaults: true
  },
  'payment-methods': {
    table: 'payment_methods',
    id: 'payment_method_id',
    columns: ['user_id', 'method_name'],
    sharedDefaults: true
  },
  budgets: {
    table: 'budgets',
    id: 'budget_id',
    columns: [
      'user_id',
      'category_id',
      'budget_amount',
      'month_num',
      'year_num'
    ]
  },
};

function config(req, res, next) {
  const selectedConfig = configs[req.params.resource];

  if (!selectedConfig) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  req.cfg = selectedConfig;
  next();
}

router.get('/categories', async (req,res,next)=>{
  try {
    const {rows}=await pool.query(`SELECT c.category_id,COALESCE(s.custom_name,c.category_name) AS category_name,c.user_id,(c.user_id IS NULL) AS is_builtin
      FROM categories c LEFT JOIN user_category_settings s ON s.category_id=c.category_id AND s.user_id=$1
      WHERE (c.user_id IS NULL OR c.user_id=$1) AND COALESCE(s.hidden,FALSE)=FALSE ORDER BY c.category_id DESC`,[req.user.user_id]);
    res.json(rows);
  } catch(error){next(error);}
});

router.put('/categories/:id', async (req,res,next)=>{
  const name=String(req.body.category_name||'').trim();
  if(!name)return res.status(400).json({message:'Category name is required'});
  try {
    const {rows}=await pool.query('SELECT user_id FROM categories WHERE category_id=$1',[req.params.id]);
    if(!rows.length)return res.status(404).json({message:'Category not found'});
    if(rows[0].user_id===null) await pool.query(`INSERT INTO user_category_settings(user_id,category_id,custom_name,hidden) VALUES($1,$2,$3,FALSE) ON CONFLICT(user_id,category_id) DO UPDATE SET custom_name=EXCLUDED.custom_name,hidden=FALSE`,[req.user.user_id,req.params.id,name]);
    else { const result=await pool.query('UPDATE categories SET category_name=$1 WHERE category_id=$2 AND user_id=$3 RETURNING category_id',[name,req.params.id,req.user.user_id]); if(!result.rowCount)return res.status(404).json({message:'Category not found'}); }
    res.json({message:'Category updated'});
  } catch(error){next(error);}
});

router.delete('/categories/:id', async (req,res,next)=>{
  try {
    const {rows}=await pool.query('SELECT user_id FROM categories WHERE category_id=$1',[req.params.id]);
    if(!rows.length)return res.status(404).json({message:'Category not found'});
    if(rows[0].user_id===null) await pool.query(`INSERT INTO user_category_settings(user_id,category_id,hidden) VALUES($1,$2,TRUE) ON CONFLICT(user_id,category_id) DO UPDATE SET hidden=TRUE`,[req.user.user_id,req.params.id]);
    else { const result=await pool.query('DELETE FROM categories WHERE category_id=$1 AND user_id=$2 RETURNING category_id',[req.params.id,req.user.user_id]); if(!result.rowCount)return res.status(404).json({message:'Category not found'}); }
    res.json({message:'Category removed'});
  } catch(error){next(error);}
});

router.get('/:resource', config, async (req, res, next) => {
  try {
    const scoped = ['accounts','budgets'].includes(req.cfg.table);
    const shared = req.cfg.sharedDefaults;
    const { rows } = await pool.query(
      `SELECT * FROM ${req.cfg.table} ${scoped?'WHERE user_id = $1':shared?'WHERE user_id IS NULL OR user_id = $1':''} ORDER BY ${req.cfg.id} DESC`,
      scoped || shared ? [req.user.user_id] : []
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/:resource', config, async (req, res, next) => {
  try {
    const selectedConfig = req.cfg;
    if (selectedConfig.columns.includes('user_id')) req.body.user_id = req.user.user_id;
    const values = selectedConfig.columns.map(
      (column) => req.body[column]
    );

    if (
      values.some(
        (value) =>
          value === undefined ||
          value === null ||
          value === ''
      )
    ) {
      return res.status(400).json({
        message: 'Required fields are missing'
      });
    }

    if (
      selectedConfig.table === 'accounts' &&
      !Number.isFinite(Number(req.body.current_balance))
    ) {
      return res.status(400).json({
        message: 'Balance must be a valid number'
      });
    }

    if (
      selectedConfig.table === 'budgets' &&
      (
        !Number.isFinite(Number(req.body.budget_amount)) ||
        Number(req.body.budget_amount) <= 0 ||
        Number(req.body.month_num) < 1 ||
        Number(req.body.month_num) > 12
      )
    ) {
      return res.status(400).json({
        message: 'Please provide a valid budget amount and month'
      });
    }

    const placeholders = selectedConfig.columns
      .map((_, index) => `$${index + 1}`)
      .join(', ');

    const { rows } = await pool.query(
      `INSERT INTO ${selectedConfig.table}
       (${selectedConfig.columns.join(', ')})
       VALUES (${placeholders})
       RETURNING ${selectedConfig.id}`,
      values
    );

    res.status(201).json({
      id: rows[0][selectedConfig.id],
      message: 'Created successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:resource/:id', config, async (req, res, next) => {
  try {
    const selectedConfig = req.cfg;
    if (selectedConfig.columns.includes('user_id')) req.body.user_id = req.user.user_id;
    const values = selectedConfig.columns.map(
      (column) => req.body[column]
    );

    if (
      values.some(
        (value) =>
          value === undefined ||
          value === null ||
          value === ''
      )
    ) {
      return res.status(400).json({
        message: 'Required fields are missing'
      });
    }

    if (
      selectedConfig.table === 'accounts' &&
      !Number.isFinite(Number(req.body.current_balance))
    ) {
      return res.status(400).json({
        message: 'Balance must be a valid number'
      });
    }

    if (
      selectedConfig.table === 'budgets' &&
      (
        !Number.isFinite(Number(req.body.budget_amount)) ||
        Number(req.body.budget_amount) <= 0 ||
        Number(req.body.month_num) < 1 ||
        Number(req.body.month_num) > 12
      )
    ) {
      return res.status(400).json({
        message: 'Please provide a valid budget amount and month'
      });
    }

    const setClause = selectedConfig.columns
      .map((column, index) => `${column} = $${index + 1}`)
      .join(', ');

    const idPlaceholder = `$${values.length + 1}`;

    const result = await pool.query(
      `UPDATE ${selectedConfig.table}
       SET ${setClause}
       WHERE ${selectedConfig.id} = ${idPlaceholder}${selectedConfig.columns.includes('user_id') ? ` AND user_id = $${values.length + 2}` : ''}
       RETURNING ${selectedConfig.id}`,
      [...values, req.params.id, ...(selectedConfig.columns.includes('user_id') ? [req.user.user_id] : [])]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Record not found'
      });
    }

    res.json({ message: 'Updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:resource/:id', config, async (req, res, next) => {
  try {
    const scoped = ['accounts','budgets'].includes(req.cfg.table) || req.cfg.sharedDefaults;
    const result = await pool.query(
      `DELETE FROM ${req.cfg.table}
       WHERE ${req.cfg.id} = $1${scoped?' AND user_id = $2':''}
       RETURNING ${req.cfg.id}`,
      scoped ? [req.params.id, req.user.user_id] : [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Record not found'
      });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
