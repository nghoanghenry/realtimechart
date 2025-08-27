const { Payment } = require('../models');

class PaymentRepository {
  async findById(id) {
    return Payment.findById(id);
  }

  async create(paymentData) {
    return Payment.create(paymentData);
  }

  async findAll(filter = {}) {
    return Payment.find(filter);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return Payment.findByIdAndUpdate(id, update, options);
  }

  async countDocuments(filter = {}) {
    return Payment.countDocuments(filter);
  }

  async updateById(id, update) {
    return Payment.findByIdAndUpdate(id, update, { new: true });
  }

  async deleteById(id) {
    return Payment.findByIdAndDelete(id);
  }
}

module.exports = new PaymentRepository();
