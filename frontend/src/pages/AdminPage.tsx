import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface QRConfig {
  bankId: string;
  accountNo: string;
  template: string;
  accountName: string;
  monthlyAmount: number;
  yearlyAmount: number;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

interface PendingPayment {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  amount: number;
  currency: string;
  status: string;
  description: string;
  metadata: {
    plan: string;
    upgradeType: string;
  };
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'qr-config' | 'payments'>('qr-config');
  
  // QR Configuration state
  const [qrConfig, setQrConfig] = useState<QRConfig>({
    bankId: 'vietinbank',
    accountNo: '113366668888',
    template: 'compact2',
    accountName: 'Crypto Trading Dashboard',
    monthlyAmount: 99000,
    yearlyAmount: 990000
  });

  // Payments state
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Banks state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    // Load banks list and QR config on component mount
    loadBanksList();
    loadQRConfig();
  }, [user, navigate]);

  // Load existing QR configuration from database
  const loadQRConfig = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3002/api/admin/qr-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.config) {
            // Load existing config from database
            setQrConfig({
              bankId: data.config.bankId,
              accountNo: data.config.accountNo,
              template: data.config.template,
              accountName: data.config.accountName,
              monthlyAmount: data.config.monthlyAmount,
              yearlyAmount: data.config.yearlyAmount
            });
            console.log('Loaded existing QR config from database:', data.config);
          } else {
            // No config in database, keep default values in form
            console.log('No QR config in database, using form default values');
          }
        }
      }
    } catch (error) {
      console.error('Error loading QR config:', error);
      // Keep current default values in state if API fails
    }
  };

  // Load banks list from VietQR API
  const loadBanksList = async () => {
    try {
      setLoadingBanks(true);
      const response = await fetch('https://api.vietqr.io/v2/banks');
      if (response.ok) {
        const data = await response.json();
        setBanks(data.data || []);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      // Set fallback banks if API fails
      setBanks([
        { id: 1, name: 'Vietinbank', code: 'ICB', bin: '970415', shortName: 'Vietinbank', logo: '', transferSupported: 1, lookupSupported: 1 },
        { id: 2, name: 'Vietcombank', code: 'VCB', bin: '970436', shortName: 'Vietcombank', logo: '', transferSupported: 1, lookupSupported: 1 },
        { id: 3, name: 'BIDV', code: 'BIDV', bin: '970418', shortName: 'BIDV', logo: '', transferSupported: 1, lookupSupported: 1 },
        { id: 4, name: 'Agribank', code: 'VBA', bin: '970405', shortName: 'Agribank', logo: '', transferSupported: 1, lookupSupported: 1 },
        { id: 5, name: 'TPBank', code: 'TPB', bin: '970423', shortName: 'TPBank', logo: '', transferSupported: 1, lookupSupported: 1 },
        { id: 6, name: 'Sacombank', code: 'STB', bin: '970403', shortName: 'Sacombank', logo: '', transferSupported: 1, lookupSupported: 1 },
        { id: 7, name: 'MB Bank', code: 'MBB', bin: '970422', shortName: 'MB Bank', logo: '', transferSupported: 1, lookupSupported: 1 },
        { id: 8, name: 'Techcombank', code: 'TCB', bin: '970407', shortName: 'Techcombank', logo: '', transferSupported: 1, lookupSupported: 1 }
      ]);
    } finally {
      setLoadingBanks(false);
    }
  };

  // Load pending payments
  useEffect(() => {
    if (activeTab === 'payments') {
      loadPendingPayments();
    }
  }, [activeTab]);

  const loadPendingPayments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3002/api/admin/pending-payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error loading pending payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRConfigSave = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3002/api/admin/qr-config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(qrConfig)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('QR Config saved successfully:', data);
        alert('✅ Cấu hình QR đã được lưu thành công!');
        // Reload the config to ensure we have the latest data
        await loadQRConfig();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save QR config');
      }
    } catch (error: any) {
      console.error('Error saving QR config:', error);
      alert(`❌ Có lỗi xảy ra khi lưu cấu hình QR: ${error.message}`);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3002/api/admin/approve-payment/${paymentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Payment đã được duyệt và user đã được nâng cấp VIP!');
        loadPendingPayments(); // Reload list
      } else {
        throw new Error('Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('❌ Có lỗi xảy ra khi duyệt payment.');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3002/api/admin/reject-payment/${paymentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('❌ Payment đã bị từ chối.');
        loadPendingPayments(); // Reload list
      } else {
        throw new Error('Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('❌ Có lỗi xảy ra khi từ chối payment.');
    }
  };

  const generateQRUrl = (amount: number, plan: string) => {
    const description = encodeURIComponent(`VIP ${plan} plan upgrade`);
    const accountName = encodeURIComponent(qrConfig.accountName);
    
    return `https://img.vietqr.io/image/${qrConfig.bankId}-${qrConfig.accountNo}-${qrConfig.template}.png?amount=${amount}&addInfo=${description}&accountName=${accountName}`;
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h1 style={{
            margin: '0 0 10px 0',
            color: '#333',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            🛠️ Admin Dashboard
          </h1>
          <p style={{ margin: 0, color: '#666' }}>
            Quản lý cấu hình QR code và duyệt payments VIP
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e1e5e9'
          }}>
            <button
              onClick={() => setActiveTab('qr-config')}
              style={{
                flex: 1,
                padding: '16px',
                border: 'none',
                backgroundColor: activeTab === 'qr-config' ? '#1890ff' : 'white',
                color: activeTab === 'qr-config' ? 'white' : '#666',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🏦 Cấu hình QR Code
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              style={{
                flex: 1,
                padding: '16px',
                border: 'none',
                backgroundColor: activeTab === 'payments' ? '#1890ff' : 'white',
                color: activeTab === 'payments' ? 'white' : '#666',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              💳 Duyệt Payments ({pendingPayments.length})
            </button>
          </div>

          {/* QR Configuration Tab */}
          {activeTab === 'qr-config' && (
            <div style={{ padding: '30px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
                Cấu hình VietQR
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#333',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Ngân hàng
                  </label>
                  <select
                    value={qrConfig.bankId}
                    onChange={(e) => setQrConfig({...qrConfig, bankId: e.target.value})}
                    disabled={loadingBanks}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: loadingBanks ? '#f5f5f5' : 'white'
                    }}
                  >
                    {loadingBanks ? (
                      <option>Đang tải danh sách ngân hàng...</option>
                    ) : (
                      <>
                        <option value="">Chọn ngân hàng</option>
                        {banks.map((bank) => (
                          <option key={bank.id} value={bank.shortName.toLowerCase()}>
                            {bank.name} ({bank.shortName})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#333',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    value={qrConfig.accountNo}
                    onChange={(e) => setQrConfig({...qrConfig, accountNo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Nhập số tài khoản"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#333',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Template QR
                  </label>
                  <select
                    value={qrConfig.template}
                    onChange={(e) => setQrConfig({...qrConfig, template: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="compact2">Compact2 - Đầy đủ thông tin</option>
                    <option value="compact">Compact - QR + Logo</option>
                    <option value="qr_only">QR Only - Chỉ mã QR</option>
                    <option value="print">Print - In ấn chi tiết</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#333',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={qrConfig.accountName}
                    onChange={(e) => setQrConfig({...qrConfig, accountName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Tên người nhận"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#333',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Gói tháng (VND)
                  </label>
                  <input
                    type="number"
                    value={qrConfig.monthlyAmount}
                    onChange={(e) => setQrConfig({...qrConfig, monthlyAmount: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#333',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Gói năm (VND)
                  </label>
                  <input
                    type="number"
                    value={qrConfig.yearlyAmount}
                    onChange={(e) => setQrConfig({...qrConfig, yearlyAmount: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    min="0"
                    step="10000"
                  />
                </div>
              </div>

              {/* QR Preview */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>
                  🔍 Preview QR Code
                </h4>
                {qrConfig.bankId && qrConfig.accountNo ? (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>Gói tháng</p>
                      <img 
                        src={generateQRUrl(qrConfig.monthlyAmount, 'monthly')}
                        alt="Monthly QR"
                        style={{ width: '180px', height: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling!.textContent = 'Lỗi tải QR code';
                        }}
                      />
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                        {qrConfig.monthlyAmount.toLocaleString()} VND
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>Gói năm</p>
                      <img 
                        src={generateQRUrl(qrConfig.yearlyAmount, 'yearly')}
                        alt="Yearly QR"
                        style={{ width: '180px', height: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling!.textContent = 'Lỗi tải QR code';
                        }}
                      />
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                        {qrConfig.yearlyAmount.toLocaleString()} VND
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    color: '#666',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    Vui lòng chọn ngân hàng và nhập số tài khoản để xem preview QR code
                  </div>
                )}
              </div>

              <button
                onClick={handleQRConfigSave}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#218838'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
              >
                💾 Lưu cấu hình
              </button>

              {/* Bank info display */}
              {qrConfig.bankId && (
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  fontSize: '13px',
                  color: '#1976d2'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    ℹ️ Thông tin ngân hàng đã chọn:
                  </div>
                  {banks.find(bank => bank.shortName.toLowerCase() === qrConfig.bankId) ? (
                    <div>
                      • Tên: {banks.find(bank => bank.shortName.toLowerCase() === qrConfig.bankId)?.name}<br/>
                      • Mã BIN: {banks.find(bank => bank.shortName.toLowerCase() === qrConfig.bankId)?.bin}<br/>
                      • Mã ngắn: {banks.find(bank => bank.shortName.toLowerCase() === qrConfig.bankId)?.shortName}
                    </div>
                  ) : (
                    <div>Ngân hàng: {qrConfig.bankId}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div style={{ padding: '30px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, color: '#333' }}>
                  Payments chờ duyệt
                </h3>
                <button
                  onClick={loadPendingPayments}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Đang tải...
                </div>
              ) : pendingPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Không có payment nào chờ duyệt
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment._id}
                      style={{
                        backgroundColor: '#f8f9fa',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e1e5e9'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: '20px', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                            👤 {payment.userId.username}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            📧 {payment.userId.email}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            🕒 {new Date(payment.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745', marginBottom: '8px' }}>
                            💰 {payment.amount.toLocaleString()} {payment.currency}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            📦 Gói: {payment.metadata.plan === 'monthly' ? 'Tháng' : 'Năm'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            📝 {payment.description}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            onClick={() => handleApprovePayment(payment._id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            ✅ Duyệt
                          </button>
                          <button
                            onClick={() => handleRejectPayment(payment._id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            ❌ Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
