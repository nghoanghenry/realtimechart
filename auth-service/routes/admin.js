const express = require('express');
const container = require('../services/Container');
const { verifyToken } = require('../middleware/auth');

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
    const result = await container.get('adminService').getQrConfig();

    res.json(result);
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
    const result = await container.get('adminService').updateQrConfig(req.user._id, req.body);

    res.json(result);
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
    const result = await container.get('adminService').getPendingPayments();

    res.json(result);
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
    const result = await container.get('adminService').approvePayment(req.params.paymentId);

    res.json(result);
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
    const result = await container.get('adminService').rejectPayment(req.params.paymentId);

    res.json(result);
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

    const result = await container.get('adminService').getAllPayments({ page, limit });

    res.json(result);
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
    const result = await container.get('adminService').getAdminStats();

    res.json(result);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
