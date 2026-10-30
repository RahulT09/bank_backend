require("dotenv").config();

const app = require("./src/index");
const connectTodB = require("./src/config/db.js");

connectTodB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
