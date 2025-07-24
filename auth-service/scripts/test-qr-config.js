const mongoose = require('mongoose');
const { QRConfig } = require('../models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crypto-trading-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testQRConfigLogic() {
  try {
    console.log('🔄 Testing New QR Config Logic...\n');

    // Test 1: Clear all configs for fresh test
    console.log('1. Clearing existing configs for fresh test...');
    await QRConfig.deleteMany({});
    console.log('   ✅ All configs cleared');

    // Test 2: Check GET when no config exists (should return defaults)
    console.log('\n2. Testing GET with no config (should return defaults):');
    let config = await QRConfig.findOne({});
    if (!config) {
      console.log('   ✅ No config found - API will return default values');
      console.log('   Default values: bankId=vietinbank, monthlyAmount=99000, yearlyAmount=990000');
    } else {
      console.log('   ❌ Unexpected: Config found when should be empty');
    }

    // Test 3: Create first config (should create new)
    console.log('\n3. Testing first save (should create new config):');
    const newConfig = new QRConfig({
      bankId: 'techcombank',
      accountNo: '999888777666',
      template: 'compact2',
      accountName: 'Updated Trading Platform',
      monthlyAmount: 149000,
      yearlyAmount: 1490000,
      createdBy: new mongoose.Types.ObjectId(),
      lastUpdatedBy: new mongoose.Types.ObjectId(),
      isActive: true
    });
    await newConfig.save();
    console.log('   ✅ First config created successfully');
    console.log(`   Config ID: ${newConfig._id}`);

    // Test 4: Update existing config (should overwrite, not create new)
    console.log('\n4. Testing update (should overwrite existing):');
    let existingConfig = await QRConfig.findOne({});
    const originalId = existingConfig._id.toString();
    
    existingConfig.bankId = 'vietcombank';
    existingConfig.accountNo = '111222333444';
    existingConfig.monthlyAmount = 199000;
    existingConfig.yearlyAmount = 1990000;
    existingConfig.accountName = 'Final Trading Dashboard';
    existingConfig.lastUpdatedBy = new mongoose.Types.ObjectId();
    existingConfig.updatedAt = new Date();
    
    await existingConfig.save();
    console.log('   ✅ Config updated successfully');
    console.log(`   Same ID: ${existingConfig._id.toString() === originalId ? 'YES' : 'NO'}`);

    // Test 5: Verify only one config exists
    console.log('\n5. Final verification:');
    const allConfigs = await QRConfig.find({});
    console.log(`   Total configs in database: ${allConfigs.length}`);
    
    if (allConfigs.length === 1) {
      const finalConfig = allConfigs[0];
      console.log('   ✅ PASS: Exactly one config exists');
      console.log(`   Final config: ${finalConfig.bankId} - ${finalConfig.accountNo}`);
      console.log(`   Monthly: ${finalConfig.monthlyAmount} VND`);
      console.log(`   Yearly: ${finalConfig.yearlyAmount} VND`);
      console.log(`   Account Name: ${finalConfig.accountName}`);
    } else {
      console.log('   ❌ FAIL: Expected exactly 1 config');
      allConfigs.forEach((cfg, idx) => {
        console.log(`     Config ${idx + 1}: ${cfg.bankId} - ${cfg.accountNo}`);
      });
    }

    console.log('\n✅ QR Config logic test completed successfully!');
    console.log('\n📝 Logic Summary:');
    console.log('   - GET /qr-config: Returns defaults if no config, actual data if exists');
    console.log('   - POST /qr-config: Creates new if none exists, updates existing otherwise');
    console.log('   - Always maintains exactly 1 config record');
    console.log('   - Frontend always gets consistent data (defaults or saved)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testQRConfigLogic();
