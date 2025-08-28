const { validatePayment } = require('../utils/validation');

class PaymentService {
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
  }

  async createPayment(userId, paymentData) {
    try {
      // Validate input
      const { error } = validatePayment(paymentData);
      if (error) {
        throw new Error(error.details[0].message);
      }

      const { amount, description } = paymentData;

      // Create payment
      const payment = await this.paymentRepository.create({
        userId: userId,
        amount,
        description,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending'
      });

      return {
        success: true,
        message: 'Payment created successfully',
        payment
      };

    } catch (error) {
      console.error('Payment creation error:', error);
      throw error;
    }
  }

  async getUserPayments(userId, paginationOptions = {}) {
    try {
      const page = parseInt(paginationOptions.page) || 1;
      const limit = parseInt(paginationOptions.limit) || 10;

      const payments = await this.paymentRepository.findAll({ userId: userId });

      const total = await this.paymentRepository.countDocuments({ userId: userId });

      return {
        success: true,
        payments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      console.error('Payments fetch error:', error);
      throw error;
    }
  }

  async getAllPayments(paginationOptions = {}) {
    try {
      const page = parseInt(paginationOptions.page) || 1;
      const limit = parseInt(paginationOptions.limit) || 10;

      const payments = await this.paymentRepository.findAll();

      const total = await this.paymentRepository.countDocuments();

      return {
        success: true,
        payments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      console.error('All payments fetch error:', error);
      throw error;
    }
  }

  async updatePaymentStatus(paymentId, status) {
    try {
      if (!['success', 'pending', 'failed'].includes(status)) {
        throw new Error('Invalid status. Must be success, pending, or failed');
      }

      const payment = await this.paymentRepository.findByIdAndUpdate(
        paymentId,
        { status },
        { new: true }
      );

      if (!payment) {
        throw new Error('Payment not found');
      }

      return {
        success: true,
        message: 'Payment status updated successfully',
        payment
      };

    } catch (error) {
      console.error('Payment status update error:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;
