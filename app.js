const express = require('express');
const session = require('express-session');
const passport = require('./controllers/authController');
const userRouter = require('./routes/userRoutes');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));

const messageRoutes = require("./routes/messageRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Login with Google</a>');
});

app.use('/auth', userRouter);

const translate = require('./controllers/transController')

app.get('/testTrans', (req, res) => {
    translate('', 'vi', 'How are you?')
    res.send("ok")
})

app.use(messageRoutes);

module.exports = app;
