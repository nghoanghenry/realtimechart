const mongoose = require('mongoose');

const qrConfigSchema = new mongoose.Schema({
  bankId: {
    type: String,
    required: true,
    default: 'vietinbank'
  },
  accountNo: {
    type: String,
    required: true,
    default: '113366668888'
  },
  template: {
    type: String,
    required: true,
    default: 'compact2'
  },
  accountName: {
    type: String,
    required: true,
    default: 'Crypto Trading Dashboard'
  },
  monthlyAmount: {
    type: Number,
    required: true,
    default: 99000
  },
  yearlyAmount: {
    type: Number,
    required: true,
    default: 990000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one active config at a time
qrConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.model('QRConfig', qrConfigSchema);
