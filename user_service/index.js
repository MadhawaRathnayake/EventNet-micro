require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db"); 
const userRoutes = require("./routes/user.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test DB connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("DB connection error:", error);
  }
})();

// Routes
app.use("/api/users", userRoutes);

// Start server
const PORT = process.env.PORT || 5000;

// Sync DB and start
sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});