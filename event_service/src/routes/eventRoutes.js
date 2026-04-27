const express = require("express");
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
} = require("../controllers/eventController");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  createEventValidation,
  updateEventValidation,
} = require("../validators/eventValidator");

router.get("/search", searchEvents);

router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.post("/", createEventValidation, validateRequest, createEvent);
router.put("/:id", updateEventValidation, validateRequest, updateEvent);
router.delete("/:id", deleteEvent);

module.exports = router;