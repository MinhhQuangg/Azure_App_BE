const express = require("express");
const app = express();
const messageRoutes = require("./routes/messageRoutes");

app.use(express.json());
app.use(messageRoutes);

module.exports = app;
