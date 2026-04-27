const pool = require("../db/db");

// POST /api/events/:id/ticket-types
const createTicketType = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { type_name, price, total_quantity, available_quantity } = req.body;

    const eventCheck = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const result = await pool.query(
      `INSERT INTO ticket_types (event_id, type_name, price, total_quantity, available_quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        eventId,
        type_name,
        price,
        total_quantity,
        available_quantity ?? total_quantity,
      ]
    );

    res.status(201).json({
      message: "Ticket type created successfully",
      ticketType: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating ticket type:", error.message);
    res.status(500).json({
      message: "Failed to create ticket type",
      error: error.message,
    });
  }
};

// GET /api/events/:id/ticket-types
const getTicketTypesByEventId = async (req, res) => {
  try {
    const { id: eventId } = req.params;

    const eventCheck = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const result = await pool.query(
      "SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY id ASC",
      [eventId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching ticket types:", error.message);
    res.status(500).json({
      message: "Failed to fetch ticket types",
      error: error.message,
    });
  }
};

// PUT /api/ticket-types/:ticketTypeId
const updateTicketType = async (req, res) => {
  try {
    const { ticketTypeId } = req.params;
    const { type_name, price, total_quantity, available_quantity } = req.body;

    const result = await pool.query(
      `UPDATE ticket_types
       SET type_name = $1,
           price = $2,
           total_quantity = $3,
           available_quantity = $4
       WHERE id = $5
       RETURNING *`,
      [type_name, price, total_quantity, available_quantity, ticketTypeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket type not found" });
    }

    res.status(200).json({
      message: "Ticket type updated successfully",
      ticketType: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating ticket type:", error.message);
    res.status(500).json({
      message: "Failed to update ticket type",
      error: error.message,
    });
  }
};

// DELETE /api/ticket-types/:ticketTypeId
const deleteTicketType = async (req, res) => {
  try {
    const { ticketTypeId } = req.params;

    const result = await pool.query(
      "DELETE FROM ticket_types WHERE id = $1 RETURNING *",
      [ticketTypeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket type not found" });
    }

    res.status(200).json({
      message: "Ticket type deleted successfully",
      ticketType: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting ticket type:", error.message);
    res.status(500).json({
      message: "Failed to delete ticket type",
      error: error.message,
    });
  }
};

module.exports = {
  createTicketType,
  getTicketTypesByEventId,
  updateTicketType,
  deleteTicketType,
};