const amqp = require("amqplib");

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange("events", "topic", { durable: true });
    await channel.assertQueue("booking.created", { durable: true });
    await channel.bindQueue("booking.created", "events", "booking.created");

    console.log("RabbitMQ connected successfully");

    // Start consuming messages
    consumeMessages();
  } catch (error) {
    console.error("RabbitMQ connection error:", error.message);
    // Retry after 5 seconds
    setTimeout(connectRabbitMQ, 5000);
  }
};

// Publish event updates to other services
const publishEvent = async (routingKey, data) => {
  try {
    if (!channel) throw new Error("RabbitMQ not connected");
    channel.publish(
      "events",
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );
    console.log(`Published: ${routingKey}`, data);
  } catch (error) {
    console.error("Publish error:", error.message);
  }
};

// Consume messages from other services
const consumeMessages = () => {
  // Listen for booking.created → update seat availability
  channel.consume("booking.created", async (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      console.log("Received booking.created:", data);
      
      try {
        const pool = require("../db/db");
        await pool.query(
          `UPDATE ticket_types 
           SET available_quantity = available_quantity - $1
           WHERE id = $2 AND available_quantity >= $1`,
          [data.quantity, data.ticketTypeId]
        );
        console.log(`Updated seat availability for ticketTypeId: ${data.ticketTypeId}`);
      } catch (err) {
        console.error("Failed to update seats:", err.message);
      }

      channel.ack(msg);
    }
  });
};

module.exports = { connectRabbitMQ, publishEvent };