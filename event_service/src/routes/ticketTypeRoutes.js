const express = require("express");
const router = express.Router();

const {
  createTicketType,
  getTicketTypesByEventId,
  updateTicketType,
  deleteTicketType,
} = require("../controllers/ticketTypeController");

const validateRequest = require("../middlewares/validationMiddleware");

const {
  createTicketTypeValidation,
  updateTicketTypeValidation,
} = require("../validators/eventValidator");


router.post(
  "/:id/ticket-types",
  createTicketTypeValidation,
  validateRequest,
  createTicketType
);

router.get("/:id/ticket-types", getTicketTypesByEventId);

router.put(
  "/ticket-types/:ticketTypeId",
  updateTicketTypeValidation,
  validateRequest,
  updateTicketType
);

router.delete("/ticket-types/:ticketTypeId", deleteTicketType);

module.exports = router;