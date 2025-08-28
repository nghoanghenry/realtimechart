class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getUserProfile(userId) {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const userProfile = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      };

      return {
        success: true,
        user: userProfile
      };
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  async getAllUsers(paginationOptions = {}) {
    try {
      const page = parseInt(paginationOptions.page) || 1;
      const limit = parseInt(paginationOptions.limit) || 10;

      const users = await this.userRepository.findAll();

      const total = await this.userRepository.countDocuments();

      return {
        success: true,
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      console.error('Users fetch error:', error);
      throw error;
    }
  }
}

module.exports = UserService;
