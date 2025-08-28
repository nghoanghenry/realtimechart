const express = require('express');
const container = require('../services/Container');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await container.get('paymentService').createPayment(req.user._id, req.body);

    res.status(201).json(result);

  } catch (error) {
    console.error('Payment creation error:', error);

    // Return specific error messages for validation errors
    if (error.message.includes('required') || error.message.includes('invalid') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Return generic server error for unexpected errors
    res.status(500).json({
      success: false,
      message: 'Server error during payment creation'
    });
  }
});

// @route   GET /api/payments
// @desc    Get user payments
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await container.get('paymentService').getUserPayments(req.user._id, req.query);

    res.json(result);
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payments/all
// @desc    Get all payments (Admin only)
// @access  Private/Admin
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await container.get('paymentService').getAllPayments(req.query);

    res.json(result);
  } catch (error) {
    console.error('All payments fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/payments/:id/status
// @desc    Update payment status (Admin only)
// @access  Private/Admin
router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await container.get('paymentService').updatePaymentStatus(req.params.id, req.body.status);

    res.json(result);

  } catch (error) {
    console.error('Payment status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
// @route   PUT /api/payments/:id/status
// @desc    Update payment status (Admin only)
// @access  Private/Admin
router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await container.get('paymentService').updatePaymentStatus(req.params.id, req.body.status);

    res.json(result);

  } catch (error) {
    console.error('Payment status update error:', error);

    // Return specific error messages for validation errors
    if (error.message.includes('Invalid status') || error.message.includes('not found') || error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Return generic server error for unexpected errors
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
