const app = require("./app");
const port = process.env.PORT || 3000;
const db = require("./config/db.config")
const roomRoute = require("./routes/roomRoutes")

app.use("/chatrooms", roomRoute);

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
