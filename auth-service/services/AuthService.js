const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../utils/validation');

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async registerUser(userData) {
    try {
      // Validate input
      const { error } = validateRegister(userData);
      if (error) {
        throw new Error(error.details[0].message);
      }

      const { username, email, password, role } = userData;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        throw new Error(existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await this.userRepository.create({
        username,
        email,
        password: hashedPassword,
        role: role || 'user'
      });

      // Generate token
      const token = generateToken(user._id);

      // Return user data (without password)
      const userDataResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      };

      return {
        success: true,
        message: 'User registered successfully',
        token,
        user: userDataResponse
      };

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async loginUser(credentials) {
    try {
      // Validate input
      const { error } = validateLogin(credentials);
      if (error) {
        throw new Error(error.details[0].message);
      }

      const { email, password } = credentials;

      // Check if user exists
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = generateToken(user._id);

      // Return user data (without password)
      const userData = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      };

      return {
        success: true,
        message: 'Login successful',
        token,
        user: userData
      };

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}

module.exports = AuthService;
