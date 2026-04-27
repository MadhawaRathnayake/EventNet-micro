const app = require("./app");
const sequelize = require("./config/db");

require("dotenv").config();

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
  console.log("DB Connected");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});