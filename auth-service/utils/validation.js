const Joi = require('joi');

// User Registration Validation
const validateRegister = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required().messages({
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('user', 'admin').default('user')
  });

  return schema.validate(data);
};

// User Login Validation
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  });

  return schema.validate(data);
};

// Payment Validation
const validatePayment = (data) => {
  const schema = Joi.object({
    amount: Joi.number().min(0).required().messages({
      'number.min': 'Amount cannot be negative',
      'any.required': 'Amount is required'
    }),
    description: Joi.string().max(255).optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateRegister,
  validateLogin,
  validatePayment
};
