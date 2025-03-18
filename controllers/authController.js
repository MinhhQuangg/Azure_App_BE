const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
const bcrypt = require('bcryptjs');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  const { username, email, password, passwordConfirm } = req.body;
  try {
    if (password !== passwordConfirm) {
      return res
        .status(400)
        .json({ message: 'Password and password confirm do not match' });
    }
    const result = await db.query('SELECT * FROM "User" WHERE email = $1', [
      email,
    ]);
    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await db.query(
      'INSERT INTO "User" (given_name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );
    const token = signToken(newUser.rows[0].id);
    return res.status(201).json({
      status: 'success',
      token,
      message: 'User created successfully',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM "User" WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ message: 'Please log in by Google account' });
    }
    const token = signToken(user.id);

    return res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          username: user.given_name,
          email: user.email,
          picture: user.profile_picture,
          created_at: user.created_at,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query('SELECT * FROM "User" WHERE id = $1', [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.given_name,
          email: user.email,
          profile_picture: user.profile_picture,
          created_at: user.created_at,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'You are not logged in! Please log in to get access',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query('SELECT * FROM "User" WHERE id = $1', [
      decoded.id,
    ]);

    if (!result.rows.length) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    const freshUser = result.rows[0];

    if (freshUser.password_changed_at) {
      const passwordChangedAt = freshUser.password_changed_at;
      if (
        passwordChangedAt &&
        passwordChangedAt > new Date(decoded.iat * 1000)
      ) {
        return res.status(401).json({
          message: 'User recently changed password! Please log in again',
        });
      }
    }

    req.user = freshUser;
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Server error during token verification' });
  }
};
