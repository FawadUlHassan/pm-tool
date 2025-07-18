import express from 'express';
import {
  getAllFields,
  getFieldById,
  createField,
  bulkCreateFields,
  updateField,
  deleteField
} from '../models/field.js';

const router = express.Router();

/** GET /api/fields — list all field definitions */
router.get('/', async (req, res, next) => {
  try {
    const fields = await getAllFields();
    res.json(fields);
  } catch (err) {
    next(err);
  }
});

/** GET /api/fields/:id — fetch one field */
router.get('/:id', async (req, res, next) => {
  try {
    const field = await getFieldById(req.params.id);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    res.json(field);
  } catch (err) {
    next(err);
  }
});

/** POST /api/fields — create a new field */
router.post('/', async (req, res, next) => {
  try {
    const newField = await createField(req.body);
    res.status(201).json(newField);
  } catch (err) {
    // handle duplicate key or validation errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Field key already exists' });
    }
    next(err);
  }
});

/** POST /api/fields/bulk — import multiple fields */
router.post('/bulk', async (req, res, next) => {
  try {
    const allFields = await bulkCreateFields(req.body);
    res.status(201).json(allFields);
  } catch (err) {
    next(err);
  }
});

// PUT /api/fields/:id
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await updateField(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'Field key already exists' });
    next(err);
  }
});

// DELETE /api/fields/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await deleteField(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;

