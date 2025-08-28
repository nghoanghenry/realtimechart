const express = require('express');
const container = require('../services/Container');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Generate QR payment info (not create payment record yet)
router.post('/create-vip-payment', verifyToken, async (req, res) => {
  try {
    const { plan, amount, currency } = req.body;
    const result = await container.get('vipService').createVipPaymentInfo(plan, amount, currency);

    res.json(result);
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
    const result = await container.get('vipService').confirmVipPayment(req.user._id, req.user.username, paymentId, plan, amount, currency);

    res.json(result);
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
    const result = await container.get('vipService').completeVipPayment(req.params.paymentId, req.user._id);

    res.json(result);
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
    const result = await container.get('vipService').getUserPaymentHistory(req.user._id);

    res.json(result);
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
    const result = await container.get('vipService').getVipStatus(req.user._id);

    res.json(result);
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
    const result = await container.get('vipService').getVipQrConfig();

    res.json(result);
  } catch (error) {
    console.error('Get VIP QR config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
