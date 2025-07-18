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
  return JSON.parse(rows[0].field_order);
}

/**
 * Upsert the column order for a given user.
 * orderArray should be an array of fieldKey strings.
 */
export async function setColumnOrder(userId, orderArray) {
  const json = JSON.stringify(orderArray);
  await db.query(
    `INSERT INTO column_orders (user_id, field_order)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE field_order = ?`,
    [userId, json, json]
  );
  return orderArray;
}

