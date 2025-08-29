require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// CORS middleware with specific origins
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173']; // Allow both 3000 and 5173
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Không được phép bởi CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet());

// Body parser middleware with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for all API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/vip', require('./routes/vip'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RealTime Chart Auth Service API',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/register - Register new user',
      'POST /api/auth/login - Login user',
      'GET /api/users/profile - Get user profile',
      'GET /api/users - Get all users (Admin)',
      'POST /api/payments - Create payment',
      'GET /api/payments - Get user payments',
      'GET /api/payments/all - Get all payments (Admin)',
      'PUT /api/payments/:id/status - Update payment status (Admin)'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue);
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/`);
});