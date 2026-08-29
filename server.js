require("dotenv").config()

const app = require("./src/index");
const connectTodB = require("./src/config/db.js")

connectTodB();

app.listen(3000, () => {
  console.log("Server is listening");
});