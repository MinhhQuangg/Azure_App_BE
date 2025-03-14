const express = require('express');
const passport = require('../controllers/authController');

const { googleLogin } = require('../controllers/googleControler');
const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.status(200).json({
      message: 'Google authentication successful',
      user: req.user,
    });
  }
);

router.get('/google/fail', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed' });
});

router.post('/google', googleLogin);

module.exports = router;
