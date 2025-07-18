// backend/routes/columnOrder.js
import express from 'express';
import { getColumnOrder, setColumnOrder } from '../models/columnOrder.js';

const router = express.Router();

// Require authentication: assume req.user.id is set by your auth middleware
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

/**
 * GET /api/column-order
 * Returns an array of fieldKey strings in the user’s saved order.
 */
router.get('/', async (req, res, next) => {
  try {
    const order = await getColumnOrder(req.user.id);
    res.json(order || []);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/column-order
 * Body: { order: [ "fieldKey1", "fieldKey2", ... ] }
 * Persists the user’s column order.
 */
router.put('/', async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array of fieldKeys' });
    }
    const saved = await setColumnOrder(req.user.id, order);
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

export default router;

