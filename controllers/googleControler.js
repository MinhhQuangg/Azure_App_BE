const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
const { v5: uuidv5 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: id, email, picture: profile_picture, given_name } = payload;
    const userId = uuidv5(id, uuidv5.DNS);

    const result = await db.query('SELECT * FROM "User" WHERE id= $1', [
      userId,
    ]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = signToken(user.id);
      return res.status(200).json({
        status: 'success',
        user: user,
        token: token,
      });
    }
    const newUser = await db.query(
      'INSERT INTO "User" (id, given_name, email, profile_picture) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, given_name, email, profile_picture]
    );
    const newToken = signToken(newUser.rows[0].id);
    return res.status(201).json({
      status: 'success',
      user: newUser.rows[0],
      token: newToken,
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return res.status(500).json({ message: 'Google authentication failed' });
  }
};
