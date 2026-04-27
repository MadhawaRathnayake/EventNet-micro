const { v4: uuidv4 } = require('uuid');

/**
 * Simulated Payment Processor (Mock Stripe)
 * 
 * This module simulates a real payment gateway like Stripe.
 * In production, replace these methods with actual Stripe SDK calls.
 * 
 * Simulation rules:
 * - Card ending in 0000 → always fails (for testing)
 * - Card ending in 1111 → simulates timeout/processing error
 * - All other cards → success
 */

class PaymentProcessor {
  /**
   * Process a payment charge
   * @param {Object} paymentDetails - Payment information
   * @returns {Object} - Processing result
   */
  static async processPayment(paymentDetails) {
    const { amount, currency, paymentMethod, cardLast4 } = paymentDetails;

    // Simulate processing delay (300ms - 2s like real gateway)
    await this._simulateDelay();

    // Generate a transaction ID (would come from Stripe in production)
    const transactionId = `txn_${uuidv4().replace(/-/g, '').substring(0, 24)}`;

    // Simulate failure scenarios
    if (cardLast4 === '0000') {
      return {
        success: false,
        transactionId: null,
        error: 'Card declined: Insufficient funds',
        errorCode: 'CARD_DECLINED',
      };
    }

    if (cardLast4 === '1111') {
      return {
        success: false,
        transactionId: null,
        error: 'Payment gateway timeout. Please try again.',
        errorCode: 'GATEWAY_TIMEOUT',
      };
    }

    // Simulate successful payment
    console.log(`💳 Payment processed: ${currency} ${amount} via ${paymentMethod}`);

    return {
      success: true,
      transactionId,
      gatewayResponse: {
        id: transactionId,
        amount: parseFloat(amount),
        currency: currency.toLowerCase(),
        status: 'succeeded',
        paymentMethod,
        created: Date.now(),
      },
    };
  }

  /**
   * Process a refund
   * @param {string} transactionId - Original transaction ID
   * @param {number} amount - Refund amount
   * @returns {Object} - Refund result
   */
  static async processRefund(transactionId, amount) {
    await this._simulateDelay();

    const refundId = `ref_${uuidv4().replace(/-/g, '').substring(0, 24)}`;

    console.log(`🔄 Refund processed: $${amount} for transaction ${transactionId}`);

    return {
      success: true,
      refundId,
      originalTransactionId: transactionId,
      amount: parseFloat(amount),
      status: 'refunded',
      created: Date.now(),
    };
  }

  /**
   * Simulate network delay (realistic gateway response time)
   */
  static _simulateDelay() {
    const delay = Math.floor(Math.random() * 1700) + 300; // 300ms - 2000ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

module.exports = PaymentProcessor;
