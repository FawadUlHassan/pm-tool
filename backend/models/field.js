import { db } from '../config/db.js';

/**
 * Fetch all fields, ordered by sort_order asc.
 */
export async function getAllFields() {
  const [rows] = await db.query(
    'SELECT id, field_key AS fieldKey, label, type, options, sort_order AS sortOrder FROM fields ORDER BY sort_order'
  );
  return rows;
}

/**
 * Fetch a single field by its PK.
 */
export async function getFieldById(id) {
  const [rows] = await db.query(
    'SELECT id, field_key AS fieldKey, label, type, options, sort_order AS sortOrder FROM fields WHERE id = ?',
    [id]
  );
  return rows[0];
}

/**
 * Insert a new field definition.
 */
export async function createField({ fieldKey, label, type, options = [], sortOrder = 0 }) {
  const [result] = await db.query(
    'INSERT INTO fields (field_key, label, type, options, sort_order) VALUES (?, ?, ?, ?, ?)',
    [fieldKey, label, type, JSON.stringify(options), sortOrder]
  );
  return getFieldById(result.insertId);
}

/**
 * Bulk‑insert multiple field definitions.
 */
export async function bulkCreateFields(fieldDefs = []) {
  if (!fieldDefs.length) return [];
  const values = fieldDefs.map(f => [
    f.fieldKey, f.label, f.type, JSON.stringify(f.options || []), f.sortOrder || 0
  ]);
  await db.query(
    'INSERT INTO fields (field_key, label, type, options, sort_order) VALUES ?',
    [values]
  );
  return getAllFields();
}

export async function updateField(id, { fieldKey, label, type, options = [], sortOrder = 0 }) {
  await db.query(
    'UPDATE fields SET field_key=?, label=?, type=?, options=?, sort_order=? WHERE id=?',
    [fieldKey, label, type, JSON.stringify(options), sortOrder, id]
  );
  return getFieldById(id);
}

export async function deleteField(id) {
  const [result] = await db.query('DELETE FROM fields WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
