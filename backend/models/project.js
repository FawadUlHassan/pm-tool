// backend/models/project.js
import { db } from '../config/db.js';

export async function getAllProjects() {
  const [rows] = await db.query(
    'SELECT id, data FROM projects ORDER BY id DESC'
  );
  return rows.map(r => {
    // Only parse if it's a string
    const projData = (typeof r.data === 'string')
      ? JSON.parse(r.data)
      : r.data;
    return { id: r.id, ...projData };
  });
}

export async function createProject(data) {
  const json = JSON.stringify(data);
  const [result] = await db.query(
    'INSERT INTO projects (data) VALUES (?)',
    [json]
  );
  return { id: result.insertId, ...data };
}

export async function updateProject(id, data) {
  const json = JSON.stringify(data);
  await db.query('UPDATE projects SET data = ? WHERE id = ?', [json, id]);
  return { id: Number(id), ...data };
}

export async function deleteProject(id) {
  const [result] = await db.query('DELETE FROM projects WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Bulk‑insert multiple projects (schemaless JSON).
 */
export async function bulkCreateProjects(dataList) {
  if (!Array.isArray(dataList) || dataList.length === 0) return [];
  // Prepare JSON rows
  const values = dataList.map(d => [ JSON.stringify(d) ]);
  // Multi‑row insert
  await db.query('INSERT INTO projects (data) VALUES ?', [values]);
  return getAllProjects();
}

/**
 * Fetch one project by ID
 */
export async function getProjectById(id) {
  const [rows] = await db.query(
    'SELECT id, data FROM projects WHERE id = ?',
    [id]
  );
  if (!rows.length) return null;

  const row = rows[0];
  // r.data may already be parsed
  const projData = (typeof row.data === 'string')
    ? JSON.parse(row.data)
    : row.data;

  return { id: row.id, ...projData };
}
