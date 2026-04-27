const Payment = require('../models/Payment');
const PaymentProcessor = require('../services/paymentProcessor');
const MessageQueueService = require('../services/messageQueue');

/**
 * Payment Controller
 * Handles all payment-related REST API operations
 */

// POST /api/payments - Create a new payment
const createPayment = async (req, res, next) => {
  try {
    const { bookingId, amount, currency, paymentMethod, cardLast4, metadata } = req.body;
    const userId = req.user.id;

    // Create payment record with 'pending' status
    const payment = await Payment.create({
      bookingId,
      userId,
      amount,
      currency: currency || 'USD',
      paymentMethod,
      cardLast4: cardLast4 || null,
      status: 'pending',
      metadata: metadata || {},
    });

    console.log(`💰 Payment created: ${payment.id} for booking: ${bookingId}`);

    // Update status to 'processing'
    await payment.update({ status: 'processing' });

    // Process the payment through the gateway
    const result = await PaymentProcessor.processPayment({
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      cardLast4: payment.cardLast4,
    });

    if (result.success) {
      // Payment succeeded
      await payment.update({
        status: 'completed',
        transactionId: result.transactionId,
      });

      // Publish success event to RabbitMQ
      try {
        await MessageQueueService.publishPaymentCompleted(payment);
      } catch (mqError) {
        console.error('⚠️ Failed to publish MQ event (payment still completed):', mqError.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          id: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          transactionId: payment.transactionId,
          paymentMethod: payment.paymentMethod,
          createdAt: payment.createdAt,
        },
      });
    } else {
      // Payment failed
      await payment.update({
        status: 'failed',
        failureReason: result.error,
      });

      // Publish failure event to RabbitMQ
      try {
        await MessageQueueService.publishPaymentFailed(payment, result.error);
      } catch (mqError) {
        console.error('⚠️ Failed to publish MQ event:', mqError.message);
      }

      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        error: result.error,
        data: {
          id: payment.id,
          bookingId: payment.bookingId,
          status: payment.status,
          failureReason: payment.failureReason,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/:id - Get payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Users can only view their own payments (admins can view all)
    if (req.user.role !== 'admin' && payment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own payments.',
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/booking/:bookingId - Get payment by booking ID
const getPaymentByBookingId = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const payments = await Payment.findAll({
      where: { bookingId },
      order: [['createdAt', 'DESC']],
    });

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No payments found for this booking',
      });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && payments[0].userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/:id/refund - Refund a payment
const refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Only completed payments can be refunded
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: `Cannot refund payment with status: ${payment.status}. Only completed payments can be refunded.`,
      });
    }

    // Verify ownership or admin
    if (req.user.role !== 'admin' && payment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
    }

    // Process refund through gateway
    const result = await PaymentProcessor.processRefund(
      payment.transactionId,
      payment.amount
    );

    if (result.success) {
      await payment.update({
        status: 'refunded',
        refundedAt: new Date(),
      });

      // Publish refund event to RabbitMQ
      try {
        await MessageQueueService.publishPaymentRefunded(payment);
      } catch (mqError) {
        console.error('⚠️ Failed to publish MQ refund event:', mqError.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: {
          id: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount,
          status: payment.status,
          refundedAt: payment.refundedAt,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Refund processing failed. Please try again.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/user/me - Get all payments for the logged-in user
const getMyPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentByBookingId,
  refundPayment,
  getMyPayments,
};
