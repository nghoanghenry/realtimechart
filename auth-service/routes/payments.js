const express = require('express');
const PaymentRepository = require('../repositories/PaymentRepository');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validatePayment } = require('../utils/validation');

const router = express.Router();

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    // Validate input
    const { error } = validatePayment(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { amount, description } = req.body;

    // Create payment
    const payment = await PaymentRepository.create({
      userId: req.user._id,
      amount,
      description,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    });

    // Populate user info
    await payment.populate('userId', 'username email');

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment
    });

  } catch (error) {
    console.error('Payment creation error:', error);
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await PaymentRepository.findAll({ userId: req.user._id });

    const total = await PaymentRepository.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await PaymentRepository.findAll();

    const total = await PaymentRepository.countDocuments();

    res.json({
      success: true,
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
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
    const { status } = req.body;

    if (!['success', 'pending', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be success, pending, or failed'
      });
    }

    const payment = await PaymentRepository.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment
    });

  } catch (error) {
    console.error('Payment status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
