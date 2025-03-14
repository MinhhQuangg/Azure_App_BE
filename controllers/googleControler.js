const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
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
    // console.log(payload);
    const { sub: id, email, picture: profile_picture, given_name } = payload;
    // console.log('Picture URL:', picture);

    const result = await db.query('SELECT * FROM "Users" WHERE id= $1', [id]);

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
      'INSERT INTO "Users" (id, username, email, profile_picture) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, given_name, email, profile_picture]
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

exports.protect = async (req, res, next) => {
  //TODO: 1) Getting token and check if it's there
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(
        new AppError('Your are not logged in! Please log in to get access'),
        401
      );
    }

    //TODO: 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //TODO: 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist',
          401
        )
      );
    }
    //TODO: 4) Check if user changed password after the token was issued
    if (freshUser.changePasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      );
    }

    req.user = freshUser;
    next();
  } catch (err) {
    next(err);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
