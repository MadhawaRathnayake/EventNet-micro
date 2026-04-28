const axios = require('axios');

const EVENT_SERVICE_BASE_URL = process.env.EVENT_SERVICE_BASE_URL || 'http://localhost:5002';

const eventServiceApi = axios.create({
  baseURL: EVENT_SERVICE_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const checkTicketAvailability = async (eventId, ticketTypeId, quantity) => {
  try {
    console.log(`[EventService] Checking availability — Event: ${eventId}, TicketType: ${ticketTypeId}, Qty: ${quantity}`);

    // Use /api/events/:id which returns event + ticketTypes
    const response = await eventServiceApi.get(`/api/events/${eventId}`);

    const { ticketTypes } = response.data;

    if (!ticketTypes || ticketTypes.length === 0) {
      console.warn(`[EventService] No ticket types found for event ${eventId}`);
      return { available: false, availableQuantity: 0 };
    }

    // Find the specific ticket type
    const ticketType = ticketTypes.find(t => t.id === ticketTypeId);

    if (!ticketType) {
      console.warn(`[EventService] TicketType ${ticketTypeId} not found for event ${eventId}`);
      return { available: false, availableQuantity: 0 };
    }

    const availableQuantity = ticketType.available_quantity;
    const available = availableQuantity >= quantity;

    console.log(`[EventService] Available: ${availableQuantity}, Requested: ${quantity}, Result: ${available ? 'OK' : 'INSUFFICIENT'}`);

    return { available, availableQuantity };

  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.warn(`[EventService] Service unreachable — proceeding without availability check`);
      return { available: true, availableQuantity: null };
    }

    if (err.response && err.response.status === 404) {
      console.warn(`[EventService] Event ${eventId} not found`);
      return { available: false, availableQuantity: 0 };
    }

    console.error('[EventService] Error checking availability:', err.message);
    return { available: true, availableQuantity: null };
  }
};

module.exports = { checkTicketAvailability };