class AdminService {
  constructor(userRepository, paymentRepository, qrConfigRepository) {
    this.userRepository = userRepository;
    this.paymentRepository = paymentRepository;
    this.qrConfigRepository = qrConfigRepository;
  }

  async getQrConfig() {
    try {
      // Find the QR config (should only be one)
      const config = await this.qrConfigRepository.findOne({});

      if (!config) {
        // Don't create anything, just return null
        return {
          success: true,
          config: null,
          isDefault: false,
          message: 'No QR configuration found. Admin needs to set up payment config first.'
        };
      }

      return {
        success: true,
        config: {
          bankId: config.bankId,
          accountNo: config.accountNo,
          template: config.template,
          accountName: config.accountName,
          monthlyAmount: config.monthlyAmount,
          yearlyAmount: config.yearlyAmount
        },
        isDefault: false
      };
    } catch (error) {
      console.error('Get QR config error:', error);
      throw error;
    }
  }

  async updateQrConfig(userId, configData) {
    try {
      const { bankId, accountNo, template, accountName, monthlyAmount, yearlyAmount } = configData;

      // Validate required fields
      if (!bankId || !accountNo || !template || !accountName || !monthlyAmount || !yearlyAmount) {
        throw new Error('All fields are required');
      }

      // Always find existing config first
      let config = await this.qrConfigRepository.findOne({});

      if (config) {
        // Update existing config (overwrite)
        await this.qrConfigRepository.updateById(config._id, {
          bankId,
          accountNo,
          template,
          accountName,
          monthlyAmount: parseInt(monthlyAmount),
          yearlyAmount: parseInt(yearlyAmount),
          lastUpdatedBy: userId,
          updatedAt: new Date(),
          isActive: true
        });
        console.log('QR Config updated (overwritten):', config._id);
      } else {
        // Create new config only if none exists
        config = await this.qrConfigRepository.create({
          bankId,
          accountNo,
          template,
          accountName,
          monthlyAmount: parseInt(monthlyAmount),
          yearlyAmount: parseInt(yearlyAmount),
          createdBy: userId,
          lastUpdatedBy: userId,
          isActive: true
        });
        console.log('QR Config created (first time):', config._id);
      }

      return {
        success: true,
        message: config.createdAt.getTime() === config.updatedAt.getTime()
          ? 'QR configuration created successfully'
          : 'QR configuration updated successfully',
        config: {
          bankId: config.bankId,
          accountNo: config.accountNo,
          template: config.template,
          accountName: config.accountName,
          monthlyAmount: config.monthlyAmount,
          yearlyAmount: config.yearlyAmount
        }
      };
    } catch (error) {
      console.error('Save QR config error:', error);
      throw error;
    }
  }

  async getPendingPayments() {
    try {
      const payments = await this.paymentRepository.findAll({ status: 'pending' });

      return {
        success: true,
        payments
      };
    } catch (error) {
      console.error('Pending payments error:', error);
      throw error;
    }
  }

  async approvePayment(paymentId) {
    try {
      // Find payment
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not pending');
      }

      // Update payment status
      await this.paymentRepository.updateById(payment._id, {
        status: 'completed',
        completedAt: new Date()
      });

      // Upgrade user to VIP
      const user = await this.userRepository.findById(payment.userId._id);

      // Set VIP expiry date based on plan
      const plan = payment.metadata?.plan;
      let vipExpiry;
      if (plan === 'monthly') {
        vipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      } else if (plan === 'yearly') {
        vipExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
      }

      await this.userRepository.updateById(user._id, {
        role: 'vip',
        vipExpiry: vipExpiry
      });

      console.log(`Admin approved payment ${paymentId}, user ${user.username} upgraded to VIP`);

      return {
        success: true,
        message: 'Payment approved and user upgraded to VIP successfully',
        payment: {
          id: payment._id,
          status: payment.status,
          user: {
            username: user.username,
            role: user.role,
            vipExpiry: user.vipExpiry
          }
        }
      };
    } catch (error) {
      console.error('Approve payment error:', error);
      throw error;
    }
  }

  async rejectPayment(paymentId) {
    try {
      // Find payment
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not pending');
      }

      // Update payment status
      await this.paymentRepository.updateById(payment._id, {
        status: 'failed',
        rejectedAt: new Date()
      });

      console.log(`Admin rejected payment ${paymentId}`);

      return {
        success: true,
        message: 'Payment rejected successfully'
      };
    } catch (error) {
      console.error('Reject payment error:', error);
      throw error;
    }
  }

  async getAllPayments(paginationOptions = {}) {
    try {
      const page = parseInt(paginationOptions.page) || 1;
      const limit = parseInt(paginationOptions.limit) || 20;

      const payments = await this.paymentRepository.findAll({});

      const total = await this.paymentRepository.countDocuments({});

      return {
        success: true,
        payments,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: payments.length,
          totalRecords: total
        }
      };
    } catch (error) {
      console.error('All payments error:', error);
      throw error;
    }
  }

  async getAdminStats() {
    try {
      const totalUsers = await this.userRepository.countDocuments({});
      const vipUsers = await this.userRepository.countDocuments({ role: 'vip' });
      const pendingPayments = await this.paymentRepository.countDocuments({ status: 'pending' });
      const completedPayments = await this.paymentRepository.countDocuments({ status: 'completed' });

      // Revenue calculation - Note: This would need to be implemented in PaymentRepository
      // For now, we'll return 0 as placeholder
      const totalRevenue = 0; // TODO: Implement aggregate in PaymentRepository

      return {
        success: true,
        stats: {
          totalUsers,
          vipUsers,
          freeUsers: totalUsers - vipUsers,
          pendingPayments,
          completedPayments,
          totalRevenue,
          conversionRate: totalUsers > 0 ? ((vipUsers / totalUsers) * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Admin stats error:', error);
      throw error;
    }
  }
}

module.exports = AdminService;
