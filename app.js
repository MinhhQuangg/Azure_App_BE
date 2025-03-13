const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());

module.exports = app;
