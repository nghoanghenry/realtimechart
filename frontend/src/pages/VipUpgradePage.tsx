import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const VipUpgradePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrConfig, setQrConfig] = useState({
    bankId: 'vietinbank',
    accountNo: '113366668888',
    template: 'compact2',
    accountName: 'Crypto Trading Dashboard',
    monthlyAmount: 99000,
    yearlyAmount: 990000
  });

  // Load QR config on component mount
  useEffect(() => {
    loadQRConfig();
  }, []);

  const loadQRConfig = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3002/api/vip/qr-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setQrConfig(data.config);
          
          if (data.isDefault) {
            console.log('VIP page using default QR config values');
          } else {
            console.log('VIP page loaded QR config from database');
          }
        }
      }
    } catch (error) {
      console.log('VIP page using default QR config due to error:', error);
      // Keep default config if API fails
    }
  };

  const plans = {
    monthly: {
      name: 'VIP Monthly',
      price: qrConfig.monthlyAmount.toLocaleString(),
      currency: 'VND',
      duration: '1 tháng',
      features: [
        'Truy cập không giới hạn tất cả biểu đồ',
        'Backtest với dữ liệu lịch sử đầy đủ',
        'Alerts và thông báo real-time',
        'Hỗ trợ kỹ thuật ưu tiên',
        'Xuất báo cáo chi tiết',
        'API access cho trading bot'
      ]
    },
    yearly: {
      name: 'VIP Yearly',
      price: qrConfig.yearlyAmount.toLocaleString(),
      currency: 'VND',
      duration: '12 tháng',
      discount: '2 tháng miễn phí!',
      features: [
        'Tất cả tính năng VIP Monthly',
        'Tiết kiệm 16% so với gói tháng',
        'Phân tích nâng cao với AI',
        'Tư vấn chiến lược đầu tư',
        'Webinar độc quyền hàng tháng',
        'Copy trading từ trader chuyên nghiệp'
      ]
    }
  };

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const token = localStorage.getItem('auth_token');
      const planData = plans[plan];
      const amount = plan === 'monthly' ? qrConfig.monthlyAmount : qrConfig.yearlyAmount;
      
      // Generate QR payment info (not create payment record yet)
      const response = await fetch('http://localhost:3002/api/vip/create-vip-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: plan,
          amount: amount,
          currency: planData.currency
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('QR payment info generated:', data);
        setPaymentId(data.payment.id);
        setSelectedPlan(plan);
        setShowQRCode(true);
      } else {
        throw new Error('Failed to generate QR payment info');
      }
    } catch (error) {
      console.error('Payment generation error:', error);
      alert('❌ Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
    }
  };

  // Generate VietQR URL using dynamic config
  const generateVietQRUrl = (plan: 'monthly' | 'yearly') => {
    const amount = plan === 'monthly' ? qrConfig.monthlyAmount : qrConfig.yearlyAmount;
    const description = encodeURIComponent(`VIP ${plan} plan ID:${paymentId}`);
    const accountName = encodeURIComponent(qrConfig.accountName);
    
    // Use dynamic QR config from admin
    return `https://img.vietqr.io/image/${qrConfig.bankId}-${qrConfig.accountNo}-${qrConfig.template}.png?amount=${amount}&addInfo=${description}&accountName=${accountName}`;
  };

  const handlePaymentComplete = async () => {
    if (!paymentId || !selectedPlan) {
      alert('❌ Không tìm thấy thông tin thanh toán. Vui lòng thử lại.');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const amount = selectedPlan === 'monthly' ? qrConfig.monthlyAmount : qrConfig.yearlyAmount;
      
      // Confirm payment and create record
      const response = await fetch('http://localhost:3002/api/vip/confirm-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: paymentId,
          plan: selectedPlan,
          amount: amount,
          currency: 'VND'
        })
      });

      if (response.ok) {
        await response.json(); // Consume response
        alert('✅ Cảm ơn bạn đã xác nhận thanh toán!\n\nAdmin sẽ kiểm tra và duyệt thanh toán trong vòng 5-10 phút. Bạn sẽ nhận được thông báo khi tài khoản VIP được kích hoạt.');
        
        setShowQRCode(false);
        setSelectedPlan(null);
        setPaymentId(null);
      } else {
        const errorData = await response.json();
        alert(`❌ Lỗi: ${errorData.message || 'Có lỗi xảy ra khi xác nhận thanh toán'}`);
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert('❌ Có lỗi xảy ra khi xác nhận thanh toán. Vui lòng thử lại.');
    }
  };

  if (showQRCode && selectedPlan) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h2 style={{ 
            color: '#333', 
            marginBottom: '20px',
            fontSize: '24px'
          }}>
            🎉 Thanh toán gói {plans[selectedPlan].name}
          </h2>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
              💰 Số tiền: {plans[selectedPlan].price} {plans[selectedPlan].currency}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              📦 Gói: {plans[selectedPlan].name} ({plans[selectedPlan].duration})
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontFamily: 'var(--font-family-primary)', backgroundColor: '#e9ecef', padding: '8px', borderRadius: '4px' }}>
              🆔 Payment ID: {paymentId}
            </div>
          </div>

          {/* VietQR Code */}
          <div style={{
            backgroundColor: '#fff',
            border: '2px solid #e1e5e9',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            display: 'inline-block'
          }}>
            <img
              src={generateVietQRUrl(selectedPlan)}
              alt="VietQR Payment Code"
              style={{
                width: '300px',
                height: 'auto',
                display: 'block'
              }}
              onError={(e) => {
                // Fallback in case VietQR fails
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGxvYWRpbmcgUVIgQ29kZTwvdGV4dD48L3N2Zz4=';
              }}
            />
          </div>

          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#1976d2'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              📱 Hướng dẫn thanh toán:
            </div>
            <div style={{ textAlign: 'left' }}>
              1. Mở app Banking hoặc ví điện tử<br />
              2. Quét mã QR code phía trên<br />
              3. Kiểm tra thông tin và xác nhận thanh toán<br />
              4. Chụp ảnh bill thanh toán để đối soát
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff3cd',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#856404'
          }}>
            ⚠️ Lưu ý: Tài khoản VIP sẽ được kích hoạt trong vòng 5-10 phút sau khi thanh toán thành công
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handlePaymentComplete}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#218838'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
            >
              ✅ Đã thanh toán
            </button>

            <button
              onClick={() => {
                setShowQRCode(false);
                setSelectedPlan(null);
                setPaymentId(null);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5a6268'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#6c757d'}
            >
              🔙 Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Early return for admin users
  if (user?.role === 'admin') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          color: 'white',
          marginBottom: '30px'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔧 Quản trị viên</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Bạn là admin, không cần nâng cấp VIP. Vui lòng sử dụng trang Admin Dashboard.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '15px',
            padding: '20px',
            marginTop: '20px'
          }}>
            <h3>🛠️ Quyền admin của bạn:</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '15px' }}>
              <li>⚙️ Quản lý cấu hình QR thanh toán</li>
              <li>✅ Duyệt/từ chối thanh toán VIP</li>
              <li>📊 Xem thống kê hệ thống</li>
              <li>👥 Quản lý người dùng</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            ⭐ Nâng cấp lên VIP
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Mở khóa toàn bộ tính năng cao cấp và trở thành trader chuyên nghiệp
          </p>
        </div>

        {/* Current Plan */}
        {user && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
              Tài khoản hiện tại của {user.username}:
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: user.role === 'vip' ? '#28a745' : '#ffc107',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {user.role === 'vip' ? '👑 VIP Member' : '🆓 Free Plan'}
            </div>
            
            {user.role === 'vip' && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                🎉 Bạn đã là thành viên VIP! Tận hưởng tất cả tính năng premium.
              </div>
            )}
          </div>
        )}

        {/* Pricing Plans */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '30px',
          marginBottom: '40px',
          opacity: user?.role === 'vip' ? 0.7 : 1,
          filter: user?.role === 'vip' ? 'grayscale(50%)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          {/* Monthly Plan */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            border: user?.role === 'vip' ? '2px solid #cccccc' : '2px solid transparent',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📅 {plans.monthly.name}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                {plans.monthly.price}
              </span>
              <span style={{ fontSize: '16px', color: '#666', marginLeft: '4px' }}>
                {plans.monthly.currency}/{plans.monthly.duration}
              </span>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 30px 0'
            }}>
              {plans.monthly.features.map((feature, index) => (
                <li key={index} style={{
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#333'
                }}>
                  <span style={{ color: '#28a745' }}>✅</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => (user?.role !== 'vip' && user?.role !== 'admin') ? handleUpgrade('monthly') : undefined}
              disabled={user?.role === 'vip' || user?.role === 'admin'}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: (user?.role === 'vip' || user?.role === 'admin') ? '#cccccc' : '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (user?.role === 'vip' || user?.role === 'admin') ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
                opacity: (user?.role === 'vip' || user?.role === 'admin') ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (user?.role !== 'vip' && user?.role !== 'admin') {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#0c7cd5';
                }
              }}
              onMouseOut={(e) => {
                if (user?.role !== 'vip' && user?.role !== 'admin') {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#1890ff';
                }
              }}
            >
              {user?.role === 'vip' ? '✅ Đã có VIP' : user?.role === 'admin' ? '🔧 Admin Account' : '🚀 Chọn gói tháng'}
            </button>
          </div>

          {/* Yearly Plan */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            border: user?.role === 'vip' ? '2px solid #cccccc' : '2px solid #28a745',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}>
            {/* Popular badge */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#28a745',
              color: 'white',
              padding: '6px 20px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              🔥 PHỔ BIẾN NHẤT
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🗓️ {plans.yearly.name}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                {plans.yearly.price}
              </span>
              <span style={{ fontSize: '16px', color: '#666', marginLeft: '4px' }}>
                {plans.yearly.currency}/{plans.yearly.duration}
              </span>
            </div>

            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              💰 {plans.yearly.discount}
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 30px 0'
            }}>
              {plans.yearly.features.map((feature, index) => (
                <li key={index} style={{
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#333'
                }}>
                  <span style={{ color: '#28a745' }}>✅</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => (user?.role !== 'vip' && user?.role !== 'admin') ? handleUpgrade('yearly') : undefined}
              disabled={user?.role === 'vip' || user?.role === 'admin'}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: (user?.role === 'vip' || user?.role === 'admin') ? '#cccccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (user?.role === 'vip' || user?.role === 'admin') ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
                opacity: (user?.role === 'vip' || user?.role === 'admin') ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (user?.role !== 'vip' && user?.role !== 'admin') {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#1e7e34';
                }
              }}
              onMouseOut={(e) => {
                if (user?.role !== 'vip' && user?.role !== 'admin') {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#28a745';
                }
              }}
            >
              {user?.role === 'vip' ? '✅ Đã có VIP' : user?.role === 'admin' ? '🔧 Admin Account' : '💎 Chọn gói năm'}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ❓ Câu hỏi thường gặp
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid #e1e5e9', paddingBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                💳 Thanh toán có an toàn không?
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                Chúng tôi sử dụng cổng thanh toán bảo mật hàng đầu với mã hóa SSL 256-bit. Thông tin thanh toán của bạn được bảo vệ tuyệt đối.
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #e1e5e9', paddingBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                🔄 Có thể hủy subscription không?
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                Bạn có thể hủy bất cứ lúc nào. Tài khoản VIP sẽ tiếp tục hoạt động đến hết chu kỳ thanh toán hiện tại.
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                📞 Hỗ trợ khách hàng?
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                Thành viên VIP được ưu tiên hỗ trợ 24/7 qua email, chat và hotline. Thời gian phản hồi trung bình dưới 2 giờ.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VipUpgradePage;
