// backend/server.js
import dotenv from 'dotenv';
dotenv.config();                  // ← ensures process.env is populated

import express from 'express';
import path from 'path';
import authRoutes from './routes/auth.js';

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

// Auth routes & landing/dashboard views
app.use('/', authRoutes);

// Serve CSS/JS & landing (login/signup)
app.use('/css', express.static(path.join(process.cwd(), 'public/css')));
app.use('/js',  express.static(path.join(process.cwd(), 'public/js')));
app.use('/', authRoutes);    // '/', '/login', '/signup', '/logout'

// ————————————————————————————————————————————————
// PROTECTION LAYER: everything below this line
// requires a valid session (i.e. req.isAuthenticated() === true)
// ————————————————————————————————————————————————

app.use((req, res, next) => {
  // allow favicon or health‑checks if you need
  if (req.path === '/favicon.ico') {
    return next();
  }
  return ensureAuthenticated(req, res, next);
});

// Protected: only reachable when logged in
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'views/dashboard.html'));
});

// 404 fallback
app.use((req, res) => res.status(404).send('Not Found'));

// Pull PORT from env (or default to 3000)
const PORT = process.env.PORT || 3000;

// Listen on all interfaces so LAN machines can connect
app.listen(PORT, '0.0.0.0', () =>
  console.log(`▶️ Server listening on http://0.0.0.0:${PORT}`)
);

