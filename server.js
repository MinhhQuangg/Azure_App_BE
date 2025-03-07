const app = require("./app");
const port = process.env.PORT || 3000;
const db = require("./config/db.config")

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
