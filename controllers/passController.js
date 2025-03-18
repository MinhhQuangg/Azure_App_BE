const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../config/db.config');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, emails, given_name } = profile;
        console.log(profile);
        const result = await db.query(
          'SELECT * FROM "Users" WHERE google_id = $1',
          [id]
        );

        if (result.rows.length > 0) {
          return done(null, result.rows[0]);
        }

        const newUser = await db.query(
          'INSERT INTO "Users" (id, username, email) VALUES ($1, $2, $3) RETURNING *',
          [id, given_name, emails[0].value]
        );

        return done(null, newUser.rows[0]);
      } catch (err) {
        console.error('Error during authentication:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM "Users" WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    console.error('Error deserializing user:', err);
    done(err, null);
  }
});

module.exports = passport;
