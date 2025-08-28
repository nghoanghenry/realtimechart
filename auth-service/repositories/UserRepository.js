const { User } = require('../models');

class UserRepository {
  async findById(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findByUsername(username) {
    return User.findOne({ username });
  }

  async findOne(filter) {
    return User.findOne(filter);
  }

  async create(userData) {
    return User.create(userData);
  }

  async updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true });
  }

  async findAll(filter = {}) {
    return User.find(filter);
  }

  async countDocuments(filter = {}) {
    return User.countDocuments(filter);
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = UserRepository;
