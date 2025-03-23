// app.js
require("dotenv").config({ path: "./config.env" });
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("./controllers/passController");

const userRouter = require("./routes/userRoutes");
const roomRoute = require("./routes/roomRoutes");
// Import your messageRoutes (the file with router.post("/rooms/:roomId/messages"))
const messageRoutes = require("./routes/messageRoutes");

const translate = require("./controllers/transController");
const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers (optional)
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "some-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Example homepage
app.get("/", (req, res) => {
  res.send('<a href="/auth/google">Login with Google</a>');
});

// Example user routes => /auth/...
app.use("/auth", userRouter);

// Example room routes => /chatroom/...
app.use("/chatroom", roomRoute);

// Mount your message routes at root => /rooms/:roomId/messages
app.use("/", messageRoutes);

// If you need translation for testing
app.get("/testTrans", (req, res) => {
  translate("", "vi", "How are you?");
  res.send("ok");
});

module.exports = app;
