// backend/server.js
import dotenv from 'dotenv';
dotenv.config();                  // ← ensures process.env is populated

import express from 'express';
import path from 'path';
import authRoutes from './routes/auth.js';

import fieldsRoutes from './routes/fields.js';
import projectsRoutes from './routes/projects.js';
import columnOrderRoutes from './routes/columnOrder.js';  // ← NEW

const app = express();

/**
 * Guard middleware: if not logged in, redirect to landing page
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/');
}

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Auth & landing routes
app.use('/', authRoutes);

// Serve static assets
app.use('/css', express.static(path.join(process.cwd(), 'public/css')));
app.use('/js',  express.static(path.join(process.cwd(), 'public/js')));

// PROTECTED APIs (no session guard yet)
app.use('/api/fields', fieldsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/column-order', columnOrderRoutes);        // ← NEW

// ————————————————————————————————————————————————
// PROTECTION LAYER: everything below requires a valid session
// ————————————————————————————————————————————————
app.use((req, res, next) => {
  if (req.path === '/favicon.ico') return next();
  return ensureAuthenticated(req, res, next);
});

// Protected UI views
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'views/dashboard.html'));
});
app.get('/projects.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'views/projects.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// 404 fallback
app.use((req, res) => res.status(404).send('Not Found'));

// Start server on all interfaces for LAN access
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`▶️ Server listening on http://0.0.0.0:${PORT}`)
);

