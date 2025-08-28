// Dependency Injection Container
const UserRepository = require('../repositories/UserRepository');
const PaymentRepository = require('../repositories/PaymentRepository');
const QRConfigRepository = require('../repositories/QRConfigRepository');

// Import Services
const AuthService = require('./AuthService');
const PaymentService = require('./PaymentService');
const UserService = require('./UserService');
const VipService = require('./VipService');
const AdminService = require('./AdminService');

class Container {
  constructor() {
    this.dependencies = new Map();
    this.registerDependencies();
  }

  registerDependencies() {
    // Register repositories
    this.dependencies.set('userRepository', new UserRepository());
    this.dependencies.set('paymentRepository', new PaymentRepository());
    this.dependencies.set('qrConfigRepository', new QRConfigRepository());

    // Register services
    this.dependencies.set('authService', new AuthService(this.get('userRepository')));
    this.dependencies.set('paymentService', new PaymentService(this.get('paymentRepository')));
    this.dependencies.set('userService', new UserService(this.get('userRepository')));
    this.dependencies.set('vipService', new VipService(
      this.get('userRepository'),
      this.get('paymentRepository'),
      this.get('qrConfigRepository')
    ));
    this.dependencies.set('adminService', new AdminService(
      this.get('userRepository'),
      this.get('paymentRepository'),
      this.get('qrConfigRepository')
    ));
  }

  get(name) {
    if (!this.dependencies.has(name)) {
      throw new Error(`Dependency ${name} not found`);
    }
    return this.dependencies.get(name);
  }

  set(name, instance) {
    this.dependencies.set(name, instance);
  }
}

module.exports = new Container();
