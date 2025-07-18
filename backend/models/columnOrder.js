// backend/models/columnOrder.js
import { db } from '../config/db.js';

/**
 * Fetch saved column order for a given user.
 * Returns an array of fieldKeys, or null if none saved.
 */
export async function getColumnOrder(userId) {
  const [rows] = await db.query(
    'SELECT field_order FROM column_orders WHERE user_id = ?',
    [userId]
  );
  if (!rows.length) return null;

  const stored = rows[0].field_order;
  if (typeof stored === 'string') {
    try {
      return JSON.parse(stored);
    } catch {
      return stored.split(',');
    }
  }
  return stored;
}

/**
 * Upsert (insert or update) the column order for a given user.
 * orderArray should be an array of fieldKey strings.
 */
export async function setColumnOrder(userId, orderArray) {
  const json = JSON.stringify(orderArray);
  await db.query(
    `INSERT INTO column_orders (user_id, field_order)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE field_order = VALUES(field_order)`,
    [userId, json]
  );
  return orderArray;
}

