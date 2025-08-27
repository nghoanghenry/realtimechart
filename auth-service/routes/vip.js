const express = require('express');
const { verifyToken } = require('../middleware/auth');
const UserRepository = require('../repositories/UserRepository');
const PaymentRepository = require('../repositories/PaymentRepository');
const QRConfigRepository = require('../repositories/QRConfigRepository');
const router = express.Router();

// Generate QR payment info (not create payment record yet)
router.post('/create-vip-payment', verifyToken, async (req, res) => {
  try {
    const { plan, amount, currency } = req.body;
    
    if (!plan || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan and amount are required' 
      });
    }

    // Generate unique payment ID for QR code
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const paymentId = `VIP_${plan.toUpperCase()}_${timestamp}_${randomStr}`;

    res.json({
      success: true,
      message: 'QR payment info generated successfully',
      payment: {
        id: paymentId,
        amount: amount,
        currency: currency || 'VND',
        plan: plan,
        status: 'draft' // Not yet created in database
      }
    });

  } catch (error) {
    console.error('VIP payment info generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Confirm payment (when user clicks "Đã thanh toán")
router.post('/confirm-payment', verifyToken, async (req, res) => {
  try {
    const { paymentId, plan, amount, currency } = req.body;
    
    if (!paymentId || !plan || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment ID, plan and amount are required' 
      });
    }

    // Check if payment already exists
    const existingPayments = await PaymentRepository.findAll({ 'metadata.paymentId': paymentId });
    const existingPayment = existingPayments[0];

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists'
      });
    }

    // Create payment record now
    const payment = await PaymentRepository.create({
      userId: req.user._id,
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

    console.log(`User ${req.user.username} confirmed payment for ${plan} plan`);

    res.json({
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
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Simulate payment completion (for demo purposes)
router.post('/complete-vip-payment/:paymentId', verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Find payment
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    // Update payment status
    await PaymentRepository.updateById(payment._id, {
      status: 'completed',
      completedAt: new Date()
    });

    // Upgrade user to VIP
    const user = await UserRepository.findById(req.user._id);
    
    // Set VIP expiry date based on plan
    const plan = payment.metadata?.plan;
    let vipExpiry;
    if (plan === 'monthly') {
      vipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (plan === 'yearly') {
      vipExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
    }
    
    await UserRepository.updateById(user._id, {
      role: 'vip',
      vipExpiry: vipExpiry
    });

    res.json({
      success: true,
      message: 'Payment completed and VIP upgrade successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        vipExpiry: user.vipExpiry
      }
    });

  } catch (error) {
    console.error('VIP payment completion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get user's payment history
router.get('/payment-history', verifyToken, async (req, res) => {
  try {
    const payments = await PaymentRepository.findAll({ userId: req.user._id });

    res.json({
      success: true,
      payments: payments
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Check VIP status
router.get('/vip-status', verifyToken, async (req, res) => {
  try {
    const user = await UserRepository.findById(req.user._id);
    
    const isVip = user.role === 'vip';
    const isExpired = isVip && user.vipExpiry && new Date() > user.vipExpiry;
    
    // Auto-downgrade if VIP expired
    if (isExpired) {
      await UserRepository.updateById(user._id, { role: 'user' });
    }

    res.json({
      success: true,
      vipStatus: {
        isVip: isVip && !isExpired,
        expiry: user.vipExpiry,
        daysRemaining: isVip && !isExpired ? 
          Math.ceil((user.vipExpiry - new Date()) / (1000 * 60 * 60 * 24)) : 0
      }
    });

  } catch (error) {
    console.error('VIP status check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get QR configuration for VIP payments
router.get('/qr-config', verifyToken, async (req, res) => {
  try {
    let config = await QRConfigRepository.findOne({});
    
    if (!config) {
      // Return default values for VIP users (they need pricing to work)
      return res.json({
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
      });
    }

    res.json({
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
    });
  } catch (error) {
    console.error('Get VIP QR config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
