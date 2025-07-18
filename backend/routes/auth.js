import express from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import flash from 'connect-flash';
import session from 'express-session';
import { findUserByEmail, findUserById, createUser } from '../models/user.js';

const router = express.Router();

// Passport config
passport.use('local',
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await findUserByEmail(email);
      if (!user) return done(null, false, { message: 'No user with that email' });
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return done(null, false, { message: 'Incorrect password' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// Middleware to expose flash & user to views
function injectLocals(req, res, next) {
  res.locals.error = req.flash('error');
  res.locals.user  = req.user;
  next();
}

// Routes
router.use(
  session({ secret: 'change-this-secret', resave: false, saveUninitialized: false }),
  passport.initialize(),
  passport.session(),
  flash(),
  injectLocals
);

router.get('/', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard.html');
  res.sendFile('views/index.html', { root: process.cwd() });
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard.html',
    failureRedirect: '/',
    failureFlash: true
  })
);

router.post('/signup', async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    if (await findUserByEmail(email)) {
      req.flash('error', 'Email already registered');
      return res.redirect('/');
    }
    const hash = await bcrypt.hash(password, 12);
    await createUser({ name, email, passwordHash: hash });
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

router.get('/logout', (req, res) => {
  req.logout(() => { res.redirect('/'); });
});

export default router;

