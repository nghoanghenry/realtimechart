const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { User, Payment, QRConfig } = require('../models');
const router = express.Router();

// Admin middleware to check admin role
const adminAuth = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {});
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Get QR Configuration (accessible to all authenticated users)
router.get('/qr-config', verifyToken, async (req, res) => {
  try {
    // Find the QR config (should only be one)
    const config = await QRConfig.findOne({});
    
    if (!config) {
      // Don't create anything, just return null
      return res.json({
        success: true,
        config: null,
        isDefault: false,
        message: 'No QR configuration found. Admin needs to set up payment config first.'
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
    console.error('Get QR config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update QR Config (admin only)
router.post('/qr-config', adminAuth, async (req, res) => {
  try {
    const { bankId, accountNo, template, accountName, monthlyAmount, yearlyAmount } = req.body;

    // Validate required fields
    if (!bankId || !accountNo || !template || !accountName || !monthlyAmount || !yearlyAmount) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Always find existing config first
    let config = await QRConfig.findOne({});
    
    if (config) {
      // Update existing config (overwrite)
      config.bankId = bankId;
      config.accountNo = accountNo;
      config.template = template;
      config.accountName = accountName;
      config.monthlyAmount = parseInt(monthlyAmount);
      config.yearlyAmount = parseInt(yearlyAmount);
      config.lastUpdatedBy = req.user._id;
      config.updatedAt = new Date();
      config.isActive = true;
      
      await config.save();
      console.log('QR Config updated (overwritten):', config._id);
    } else {
      // Create new config only if none exists
      config = new QRConfig({
        bankId,
        accountNo,
        template,
        accountName,
        monthlyAmount: parseInt(monthlyAmount),
        yearlyAmount: parseInt(yearlyAmount),
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id,
        isActive: true
      });
      
      await config.save();
      console.log('QR Config created (first time):', config._id);
    }

    res.json({
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
    });
  } catch (error) {
    console.error('Save QR config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save QR config'
    });
  }
});

// Get pending payments
router.get('/pending-payments', adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Approve payment
router.post('/approve-payment/:paymentId', adminAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Find payment
    const payment = await Payment.findById(paymentId).populate('userId');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not pending'
      });
    }

    // Update payment status
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // Upgrade user to VIP
    const user = await User.findById(payment.userId._id);
    user.role = 'vip';
    
    // Set VIP expiry date based on plan
    const plan = payment.metadata?.plan;
    if (plan === 'monthly') {
      user.vipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (plan === 'yearly') {
      user.vipExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
    }
    
    await user.save();

    console.log(`Admin approved payment ${paymentId}, user ${user.username} upgraded to VIP`);

    res.json({
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
    });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reject payment
router.post('/reject-payment/:paymentId', adminAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not pending'
      });
    }

    // Update payment status
    payment.status = 'failed';
    payment.rejectedAt = new Date();
    await payment.save();

    console.log(`Admin rejected payment ${paymentId}`);

    res.json({
      success: true,
      message: 'Payment rejected successfully'
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all payments (admin view)
router.get('/all-payments', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({})
      .populate('userId', 'username email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({});

    res.json({
      success: true,
      payments,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: payments.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('All payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const vipUsers = await User.countDocuments({ role: 'vip' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    
    // Revenue calculation
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
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
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
