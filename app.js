const express = require("express");
const app = express();
app.use(express.json());

const translate = require('./controllers/transController')

app.get('/testTrans', (req, res) => {
    translate('en', 'vi', 'How are you?')
    res.send("ok")
})

module.exports = app;
