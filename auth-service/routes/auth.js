const express = require('express');
const container = require('../services/Container');
const { validateRegister, validateLogin } = require('../utils/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const result = await container.get('authService').registerUser(req.body);

    res.status(201).json(result);

  } catch (error) {
    console.error('Registration error:', error);

    // Return specific error messages for validation errors
    if (error.message.includes('already') || error.message.includes('required') || error.message.includes('invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Return generic server error for unexpected errors
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const result = await container.get('authService').loginUser(req.body);

    res.json(result);

  } catch (error) {
    console.error('Login error:', error);

    // Return specific error messages for authentication errors
    if (error.message.includes('Invalid email or password') || error.message.includes('required') || error.message.includes('invalid')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    // Return generic server error for unexpected errors
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

module.exports = router;
