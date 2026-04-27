const { body } = require("express-validator");

const createEventValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required"),

  body("venue")
    .trim()
    .notEmpty()
    .withMessage("Venue is required"),

  body("event_date")
    .notEmpty()
    .withMessage("Event date is required")
    .isDate()
    .withMessage("Event date must be a valid date"),

  body("event_time")
    .notEmpty()
    .withMessage("Event time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage("Event time must be in HH:MM:SS format"),

  body("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Category must be at most 100 characters"),

  body("organizer_name")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Organizer name must be at most 255 characters"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "CANCELLED", "SOLD_OUT"])
    .withMessage("Status must be ACTIVE, INACTIVE, CANCELLED, or SOLD_OUT"),
];

const updateEventValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),

  body("venue")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Venue cannot be empty"),

  body("event_date")
    .optional()
    .isDate()
    .withMessage("Event date must be a valid date"),

  body("event_time")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage("Event time must be in HH:MM:SS format"),

  body("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Category must be at most 100 characters"),

  body("organizer_name")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Organizer name must be at most 255 characters"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "CANCELLED", "SOLD_OUT"])
    .withMessage("Status must be ACTIVE, INACTIVE, CANCELLED, or SOLD_OUT"),
];

const createTicketTypeValidation = [
  body("type_name")
    .trim()
    .notEmpty()
    .withMessage("Ticket type name is required"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),

  body("total_quantity")
    .notEmpty()
    .withMessage("Total quantity is required")
    .isInt({ min: 0 })
    .withMessage("Total quantity must be a non-negative integer"),

  body("available_quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Available quantity must be a non-negative integer"),
];

const updateTicketTypeValidation = [
  body("type_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Ticket type name cannot be empty"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),

  body("total_quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Total quantity must be a non-negative integer"),

  body("available_quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Available quantity must be a non-negative integer"),
];

module.exports = {
  createEventValidation,
  updateEventValidation,
  createTicketTypeValidation,
  updateTicketTypeValidation,
};