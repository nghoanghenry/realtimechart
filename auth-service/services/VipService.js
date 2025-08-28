class VipService {
  constructor(userRepository, paymentRepository, qrConfigRepository) {
    this.userRepository = userRepository;
    this.paymentRepository = paymentRepository;
    this.qrConfigRepository = qrConfigRepository;
  }

  async createVipPaymentInfo(plan, amount, currency) {
    try {
      if (!plan || !amount) {
        throw new Error('Plan and amount are required');
      }

      // Generate unique payment ID for QR code
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const paymentId = `VIP_${plan.toUpperCase()}_${timestamp}_${randomStr}`;

      return {
        success: true,
        message: 'QR payment info generated successfully',
        payment: {
          id: paymentId,
          amount: amount,
          currency: currency || 'VND',
          plan: plan,
          status: 'draft' // Not yet created in database
        }
      };

    } catch (error) {
      console.error('VIP payment info generation error:', error);
      throw error;
    }
  }

  async confirmVipPayment(userId, userUsername, paymentId, plan, amount, currency) {
    try {
      if (!paymentId || !plan || !amount) {
        throw new Error('Payment ID, plan and amount are required');
      }

      // Check if payment already exists
      const existingPayments = await this.paymentRepository.findAll({ 'metadata.paymentId': paymentId });
      const existingPayment = existingPayments[0];

      if (existingPayment) {
        throw new Error('Payment already exists');
      }

      // Create payment record now
      const payment = await this.paymentRepository.create({
        userId: userId,
        amount: parseInt(amount),
        currency: currency || 'VND',
        status: 'pending',
        paymentMethod: 'qr_transfer',
        description: `VIP ${plan} plan upgrade`,
        metadata: {
          plan: plan,
          upgradeType: 'vip',
          paymentId: paymentId
        }
      });

      console.log(`User ${userUsername} confirmed payment for ${plan} plan`);

      return {
        success: true,
        message: 'Payment confirmed and submitted for admin approval',
        payment: {
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          plan: plan,
          status: payment.status,
          message: 'Admin sẽ kiểm tra và duyệt thanh toán trong vòng 5-10 phút'
        }
      };

    } catch (error) {
      console.error('Payment confirmation error:', error);
      throw error;
    }
  }

  async completeVipPayment(userId, paymentId) {
    try {
      // Find payment
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify payment belongs to user
      if (payment.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }

      // Update payment status
      await this.paymentRepository.updateById(payment._id, {
        status: 'completed',
        completedAt: new Date()
      });

      // Upgrade user to VIP
      const user = await this.userRepository.findById(userId);

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

      return {
        success: true,
        message: 'Payment completed and VIP upgrade successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          vipExpiry: user.vipExpiry
        }
      };

    } catch (error) {
      console.error('VIP payment completion error:', error);
      throw error;
    }
  }

  async getUserPaymentHistory(userId) {
    try {
      const payments = await this.paymentRepository.findAll({ userId: userId });

      return {
        success: true,
        payments: payments
      };

    } catch (error) {
      console.error('Payment history error:', error);
      throw error;
    }
  }

  async getVipStatus(userId) {
    try {
      const user = await this.userRepository.findById(userId);

      const isVip = user.role === 'vip';
      const isExpired = isVip && user.vipExpiry && new Date() > user.vipExpiry;

      // Auto-downgrade if VIP expired
      if (isExpired) {
        await this.userRepository.updateById(user._id, { role: 'user' });
      }

      return {
        success: true,
        vipStatus: {
          isVip: isVip && !isExpired,
          expiry: user.vipExpiry,
          daysRemaining: isVip && !isExpired ?
            Math.ceil((user.vipExpiry - new Date()) / (1000 * 60 * 60 * 24)) : 0
        }
      };

    } catch (error) {
      console.error('VIP status check error:', error);
      throw error;
    }
  }

  async getVipQrConfig() {
    try {
      let config = await this.qrConfigRepository.findOne({});

      if (!config) {
        // Return default values for VIP users (they need pricing to work)
        return {
          success: true,
          config: {
            bankId: 'vietinbank',
            accountNo: '113366668888',
            template: 'compact2',
            accountName: 'Crypto Trading Dashboard',
            monthlyAmount: 99000,
            yearlyAmount: 990000
          },
          isDefault: true,
          message: 'Using default QR configuration for VIP payments.'
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
      console.error('Get VIP QR config error:', error);
      throw error;
    }
  }
}

module.exports = VipService;
