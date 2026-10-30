require("dotenv").config();

const app = require("./src/index");
const connectTodB = require("./src/config/db.js");


const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
connectTodB();
