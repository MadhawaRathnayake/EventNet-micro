require("dotenv").config();
const app = require("./app");
const { connectRabbitMQ } = require("./services/rabbitmq");

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Event Service running on port ${PORT}`);
  connectRabbitMQ();
});