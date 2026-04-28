// services/queueProducer.js
const amqp = require("amqplib");

let channel = null;

const connectRabbitMQ = async () => {
  if (channel) return; // already connected
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  // Declare both queues
  await channel.assertQueue("booking.created", { durable: true });
  await channel.assertQueue("booking.confirmed", { durable: true });

  console.log("[QueueProducer] RabbitMQ connected");
};

const sendPaymentRequest = async (bookingData) => {
  try {
    await connectRabbitMQ();

    const message = {
      eventType: "PAYMENT_REQUESTED",
      bookingId: bookingData.bookingId,
      userId: bookingData.userId,
      amount: bookingData.totalAmount,
      currency: "LKR",
      items: bookingData.items.map(item => ({
        eventId: item.event_id || item.eventId,
        ticketTypeId: item.ticket_type_id || item.ticketTypeId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price || item.unitPrice)
      }))
    };

    channel.sendToQueue(
      "booking.created",
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    console.log(`[QueueProducer] PAYMENT_REQUESTED sent for booking ${bookingData.bookingId}`);
    return message;
  } catch (err) {
    console.error("[QueueProducer] Failed to send payment request:", err.message);
    throw err;
  }
};

const sendBookingConfirmed = async (bookingData) => {
  try {
    await connectRabbitMQ();

    const message = {
      eventType: "BOOKING_CONFIRMED",
      bookingId: bookingData.bookingId,
      userId: bookingData.userId,
      eventId: bookingData.eventId,
      ticketTypeId: bookingData.ticketTypeId,
      quantity: bookingData.quantity,
      paymentStatus: "SUCCESS"
    };

    channel.sendToQueue(
      "booking.confirmed",
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    console.log(`[QueueProducer] BOOKING_CONFIRMED sent for booking ${bookingData.bookingId}`);
    return message;
  } catch (err) {
    console.error("[QueueProducer] Failed to send booking confirmed:", err.message);
    throw err;
  }
};

module.exports = { sendPaymentRequest, sendBookingConfirmed };