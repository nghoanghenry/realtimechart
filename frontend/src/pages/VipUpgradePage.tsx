"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  Crown,
  Star,
  Check,
  CreditCard,
  Smartphone,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Gift,
  Calendar,
  Zap,
  HelpCircle,
  Shield,
  RotateCcw,
  Phone,
} from "lucide-react"

const VipUpgradePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrConfig, setQrConfig] = useState({
    bankId: 'vietinbank',
    accountNo: '113366668888',
    template: 'compact2',
    accountName: 'TradeX',
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
      const response = await fetch('http://localhost:3010/api/vip/qr-config', {
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
      duration: '1 month',
      features: [
        'Unlimited access to all charts',
        'Backtest with full historical data',
        'Real-time alerts and notifications',
        'Priority technical support',
        'Export detailed reports',
        'API access for trading bot'
      ]
    },
    yearly: {
      name: 'VIP Yearly',
      price: qrConfig.yearlyAmount.toLocaleString(),
      currency: 'VND',
      duration: '12 months',
      discount: '2 months free!',
      features: [
        'All VIP Monthly features',
        'Save 16% compared to monthly plan',
        'Advanced AI analysis',
        'Investment strategy consultation',
        'Exclusive monthly webinars',
        'Copy trading from professional traders'
      ]
    }
  };

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const token = localStorage.getItem('auth_token');
      const planData = plans[plan];
      const amount = plan === 'monthly' ? qrConfig.monthlyAmount : qrConfig.yearlyAmount;
      
      // Generate QR payment info (not create payment record yet)
      const response = await fetch('http://localhost:3010/api/vip/create-vip-payment', {
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
      alert('❌ An error occurred while creating payment. Please try again.');
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
      alert('❌ Payment information not found. Please try again.');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const amount = selectedPlan === 'monthly' ? qrConfig.monthlyAmount : qrConfig.yearlyAmount;
      
      // Confirm payment and create record
      const response = await fetch('http://localhost:3010/api/vip/confirm-payment', {
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
        alert('✅ Thank you for confirming your payment!\n\nAdmin will review and approve the payment within 5-10 minutes. You will receive a notification when your VIP account is activated.');
        
        setShowQRCode(false);
        setSelectedPlan(null);
        setPaymentId(null);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message || 'An error occurred while confirming payment'}`);
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert('❌ An error occurred while confirming payment. Please try again.');
    }
  };

  if (showQRCode && selectedPlan) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            textAlign: "center",
            maxWidth: "500px",
            width: "100%",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "16px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <Star className="w-6 h-6" />
            <h2
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: "700",
              }}
            >
              Payment for {plans[selectedPlan].name}
            </h2>
          </div>

          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#1e293b",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <CreditCard className="w-5 h-5" />
              Amount: {plans[selectedPlan].price} {plans[selectedPlan].currency}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Gift className="w-4 h-4" />
              Plan: {plans[selectedPlan].name} ({plans[selectedPlan].duration})
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                fontFamily: "var(--font-family-primary)",
                backgroundColor: "#e2e8f0",
                padding: "8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Settings className="w-4 h-4" />
              Payment ID: {paymentId}
            </div>
          </div>

          {/* VietQR Code */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              display: "inline-block",
            }}
          >
            <img
              src={generateVietQRUrl(selectedPlan) || "/placeholder.svg"}
              alt="VietQR Payment Code"
              style={{
                width: '300px',
                height: 'auto',
                display: 'block'
              }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGxvYWRpbmcgUVIgQ29kZTwvdGV4dD48L3N2Zz4="
              }}
            />
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              color: "#1e40af",
              border: "1px solid #93c5fd",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Smartphone className="w-4 h-4" />
              Payment instructions:
            </div>
            <div style={{ textAlign: "left" }}>
              1. Open Banking app or e-wallet
              <br />
              2. Scan the QR code above
              <br />
              3. Verify information and confirm payment
              <br />
              4. Take a screenshot of the payment receipt for verification
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#92400e",
              border: "1px solid #f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Note: Your VIP account will be activated within 5-10 minutes after successful payment
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={handlePaymentComplete}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseOver={(e) => ((e.target as HTMLButtonElement).style.transform = "translateY(-2px)")}
              onMouseOut={(e) => ((e.target as HTMLButtonElement).style.transform = "translateY(0)")}
            >
              <Check className="w-4 h-4" />
              Payment completed
            </button>

            <button
              onClick={() => {
                setShowQRCode(false)
                setSelectedPlan(null)
                setPaymentId(null)
              }}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseOver={(e) => ((e.target as HTMLButtonElement).style.transform = "translateY(-2px)")}
              onMouseOut={(e) => ((e.target as HTMLButtonElement).style.transform = "translateY(0)")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Early return for admin users
  if (user?.role === "admin") {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            borderRadius: "20px",
            padding: "40px",
            textAlign: "center",
            color: "white",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <Settings className="w-8 h-8" />
            <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Administrator</h1>
          </div>
          <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>
            You are an admin, no need to upgrade to VIP. Please use the Admin Dashboard page.
          </p>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: "15px",
              padding: "20px",
              marginTop: "20px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <h3 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Settings className="w-5 h-5" />
              Your admin privileges:
            </h3>
            <ul style={{ listStyle: "none", padding: 0, marginTop: "15px" }}>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Settings className="w-4 h-4" />
                Manage QR payment configuration
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Check className="w-4 h-4" />
                Approve/reject VIP payments
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Star className="w-4 h-4" />
                View system statistics
              </li>
              <li style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Crown className="w-4 h-4" />
                Manage users
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <Star className="w-10 h-10 text-yellow-500" />
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              Upgrade to VIP
            </h1>
          </div>
          <p
            style={{
              fontSize: "18px",
              color: "#64748b",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Unlock all premium features and become a professional trader
          </p>
        </div>

        {/* Current Plan */}
        {user && (
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              marginBottom: "40px",
              textAlign: "center",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "16px", color: "#64748b", marginBottom: "8px" }}>
              Current account of {user.username}:
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: user.role === "vip" ? "#facc15" : "#f59e0b",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {user.role === "vip" ? (
                <>
                  <Crown className="w-5 h-5" />
                  VIP Member
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Free Plan
                </>
              )}
            </div>

            {user.role === "vip" && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  color: "#b45309",
                  borderRadius: "8px",
                  fontSize: "14px",
                  border: "1px solid #facc15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Star className="w-4 h-4 text-yellow-500" />
                You are already a VIP member! Enjoy all premium features.
              </div>
            )}
          </div>
        )}

        {/* Pricing Plans */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "30px",
            marginBottom: "40px",
            opacity: user?.role === "vip" ? 0.7 : 1,
            filter: user?.role === "vip" ? "grayscale(50%)" : "none",
            transition: "all 0.3s ease",
          }}
        >
          {/* Monthly Plan */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "30px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              border: user?.role === "vip" ? "2px solid #cbd5e1" : "2px solid transparent",
              transition: "all 0.3s ease",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1e293b",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calendar className="w-6 h-6 text-blue-600" />
              {plans.monthly.name}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "32px", fontWeight: "bold", color: "#1e40af" }}>{plans.monthly.price}</span>
              <span style={{ fontSize: "16px", color: "#64748b", marginLeft: "4px" }}>
                {plans.monthly.currency}/{plans.monthly.duration}
              </span>
            </div>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 30px 0",
              }}
            >
              {plans.monthly.features.map((feature, index) => (
                <li
                  key={index}
                  style={{
                    padding: "8px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#1e293b",
                  }}
                >
                  <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: "auto" }}>
              <button
                onClick={() => (user?.role !== 'vip' && user?.role !== 'admin') ? handleUpgrade('monthly') : undefined}
                disabled={user?.role === 'vip' || user?.role === 'admin'}
                style={{
                  width: "100%",
                  padding: "14px",
                  background:
                    user?.role === "vip" || user?.role === "admin"
                      ? "#cbd5e1"
                      : "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: user?.role === "vip" || user?.role === "admin" ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  opacity: user?.role === "vip" || user?.role === "admin" ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseOver={(e) => {
                  if (user?.role !== "vip" && user?.role !== "admin") {
                    ;(e.target as HTMLButtonElement).style.transform = "translateY(-2px)"
                  }
                }}
                onMouseOut={(e) => {
                  if (user?.role !== "vip" && user?.role !== "admin") {
                    ;(e.target as HTMLButtonElement).style.transform = "translateY(0)"
                  }
                }}
              >
                {user?.role === "vip" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Already VIP
                  </>
                ) : user?.role === "admin" ? (
                  <>
                    <Settings className="w-4 h-4" />
                    Admin Account
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Select monthly plan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Yearly Plan */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "30px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              border: user?.role === "vip" ? "2px solid #cbd5e1" : "2px solid #facc15",
              transition: "all 0.3s ease",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* Popular badge */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #facc15 0%, #fde68a 100%)",
                color: "white",
                padding: "6px 20px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              MOST POPULAR
            </div>

            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1e293b",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calendar className="w-6 h-6 text-yellow-500" />
              {plans.yearly.name}
            </div>

            <div style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "32px", fontWeight: "bold", color: "#facc15" }}>{plans.yearly.price}</span>
              <span style={{ fontSize: "16px", color: "#64748b", marginLeft: "4px" }}>
                {plans.yearly.currency}/{plans.yearly.duration}
              </span>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                color: "#b45309",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "20px",
                textAlign: "center",
                border: "1px solid #facc15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Gift className="w-4 h-4" />
              {plans.yearly.discount}
            </div>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 30px 0",
              }}
            >
              {plans.yearly.features.map((feature, index) => (
                <li
                  key={index}
                  style={{
                    padding: "8px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#1e293b",
                  }}
                >
                  <Check className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={() => (user?.role !== "vip" && user?.role !== "admin" ? handleUpgrade("yearly") : undefined)}
                disabled={user?.role === "vip" || user?.role === "admin"}
                style={{
                  width: "100%",
                  padding: "14px",
                  background:
                    user?.role === "vip" || user?.role === "admin"
                      ? "#cbd5e1"
                      : "linear-gradient(135deg, #facc15 0%, #fde68a 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: user?.role === "vip" || user?.role === "admin" ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  opacity: user?.role === "vip" || user?.role === "admin" ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseOver={(e) => {
                  if (user?.role !== "vip" && user?.role !== "admin") {
                    ;(e.target as HTMLButtonElement).style.transform = "translateY(-2px)"
                  }
                }}
                onMouseOut={(e) => {
                  if (user?.role !== "vip" && user?.role !== "admin") {
                    ;(e.target as HTMLButtonElement).style.transform = "translateY(0)"
                  }
                }}
              >
                {user?.role === "vip" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Already VIP
                  </>
                ) : user?.role === "admin" ? (
                  <>
                    <Settings className="w-4 h-4" />
                    Admin Account
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Select yearly plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: "20px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </h3>

          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#1e293b",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Shield className="w-4 h-4 text-blue-600" />
                Is payment secure?
              </div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>
                We use a leading secure payment gateway with 256-bit SSL encryption. Your payment information is fully
                protected.
              </div>
            </div>

            <div>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#1e293b",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Phone className="w-4 h-4 text-yellow-500" />
                Customer support?
              </div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>
                VIP members receive priority 24/7 support via email, chat, and hotline. Average response time is under 2 hours.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VipUpgradePage;
