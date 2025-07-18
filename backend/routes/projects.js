// backend/routes/projects.js
import express from 'express';
import { db } from '../config/db.js';  // ← ADD THIS
import {
  getAllProjects,
  getProjectById,
  createProject,
  bulkCreateProjects,
  updateProject,
  deleteProject
} from '../models/project.js';

const router = express.Router();

// List all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await getAllProjects();
    res.json(projects);
  } catch (err) { next(err); }
});

// Get one project
router.get('/:id', async (req, res, next) => {
  try {
    const proj = await getProjectById(req.params.id);
    if (!proj) return res.status(404).json({ error: 'Not found' });
    res.json(proj);
  } catch (err) { next(err); }
});

// Create a project
router.post('/', async (req, res, next) => {
  try {
    const proj = await createProject(req.body);
    res.status(201).json(proj);
  } catch (err) { next(err); }
});

// Bulk import projects
router.post('/bulk', async (req, res, next) => {
  try {
    const all = await bulkCreateProjects(req.body);
    res.status(201).json(all);
  } catch (err) { next(err); }
});

// Update a project
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await updateProject(req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});

// Delete a single project
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await deleteProject(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// **Bulk‐delete** endpoint
router.post('/bulk-delete', async (req, res, next) => {
  try {
    const ids = (req.body.ids || []).map(id => Number(id)).filter(Boolean);
    if (!ids.length) {
      return res.status(400).json({ error: 'No IDs provided' });
    }
    // Delete all matching IDs
    await db.query(
      `DELETE FROM projects WHERE id IN (${ids.join(',')})`
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

