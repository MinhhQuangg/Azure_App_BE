const app = require("./app");
const port = process.env.PORT || 3000;
const db = require("./models/dbModel");

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
