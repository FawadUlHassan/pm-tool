// backend/routes/projects.js
import express from 'express';
import {
  getAllProjects,
  createProject,
  bulkCreateProjects,
  updateProject,
  deleteProject
} from '../models/project.js';

const router = express.Router();

// List projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await getAllProjects();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// Add a new project
router.post('/', async (req, res, next) => {
  try {
    const proj = await createProject(req.body);
    res.status(201).json(proj);
  } catch (err) {
    next(err);
  }
});

/** POST /api/projects/bulk — import many projects */
router.post('/bulk', async (req, res, next) => {
  try {
    const inserted = await bulkCreateProjects(req.body);
    res.status(201).json(inserted);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await updateProject(req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await deleteProject(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;

