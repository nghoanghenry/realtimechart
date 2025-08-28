const QRConfig = require('../models/QRConfig');

class QRConfigRepository {
  async findById(id) {
    return QRConfig.findById(id);
  }

  async findOne(filter = {}) {
    return QRConfig.findOne(filter);
  }

  async create(data) {
    return QRConfig.create(data);
  }

  async findAll(filter = {}) {
    return QRConfig.find(filter);
  }

  async updateById(id, update) {
    return QRConfig.findByIdAndUpdate(id, update, { new: true });
  }

  async deleteById(id) {
    return QRConfig.findByIdAndDelete(id);
  }
}

module.exports = QRConfigRepository;
