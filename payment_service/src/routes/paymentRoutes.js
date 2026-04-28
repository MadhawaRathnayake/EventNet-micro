const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  createPayment,
  getPaymentById,
  getPaymentByBookingId,
  refundPayment,
  getMyPayments,
} = require('../controllers/paymentController');

const router = express.Router();

// ─── Health Check (no auth required) ────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'payment-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── All routes below require JWT authentication ────────────────

// POST /api/payments - Create a new payment
router.post(
  '/',
  authenticate,
  [
    body('bookingId')
      .notEmpty()
      .withMessage('Booking ID is required')
      .isInt()
      .withMessage('Booking ID must be an integer'),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'LKR'])
      .withMessage('Currency must be one of: USD, EUR, GBP, LKR'),
    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'])
      .withMessage('Invalid payment method'),
    body('cardLast4')
      .optional()
      .isLength({ min: 4, max: 4 })
      .withMessage('Card last 4 must be exactly 4 digits')
      .isNumeric()
      .withMessage('Card last 4 must be numeric'),
  ],
  validateRequest,
  createPayment
);

// GET /api/payments/user/me - Get my payments (must be before /:id)
router.get(
  '/user/me',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status')
      .optional()
      .isIn(['pending', 'processing', 'completed', 'failed', 'refunded'])
      .withMessage('Invalid status filter'),
  ],
  validateRequest,
  getMyPayments
);

// GET /api/payments/booking/:bookingId - Get payment by booking ID
router.get(
  '/booking/:bookingId',
  authenticate,
  [
    param('bookingId').isInt().withMessage('Booking ID must be an integer')
  ],
  validateRequest,
  getPaymentByBookingId
);

// GET /api/payments/:id - Get payment by ID
router.get(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Payment ID must be a valid UUID'),
  ],
  validateRequest,
  getPaymentById
);

// POST /api/payments/:id/refund - Refund a payment
router.post(
  '/:id/refund',
  authenticate,
  [
    param('id').isUUID().withMessage('Payment ID must be a valid UUID'),
  ],
  validateRequest,
  refundPayment
);

/**
 * Validation middleware - checks express-validator results
 */
function validateRequest(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

module.exports = router;
