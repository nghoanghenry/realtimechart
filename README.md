# Real-Time Financial Analysis System
*Hệ thống Phân tích và Dự đoán Xu hướng Tài chính Realtime*

> *This project is in active development and may not be fully functional yet.*

## Mô tả / Description

Đây là đồ án cuối kỳ môn Kiến trúc Phần mềm - Xây dựng hệ thống hỗ trợ phân tích và dự đoán xu hướng tài chính sử dụng trí tuệ nhân tạo (AI).

This is a final project for Software Architecture course - Building a financial analysis and prediction system using artificial intelligence.

## Todos
Phần 1: Hoàng + Nhi

Phần 2: Khang + Bảo => tạo ra API để Nhi hiển thị lên các tin tức + kết quả dự đoán dựa trên tin tức
 - hover for info

Phần 3: Khang + Bảo 

Phần 4: Hoàng + Khang + Bảo
+ Tùy chọn chiến lược kết hợp không liên quan phần 3 Hoàng
+ Chiến lược kết hợp liên quan đến tin tức của phần 3 (Khang Bảo)

Phần 5: Hoàng + Nhi

## Mục tiêu / Objectives

- Áp dụng kiến thức thiết kế kiến trúc phần mềm
- Đánh giá các quyết định kiến trúc và phân tích trade-offs
- Xây dựng kiến trúc hệ thống sử dụng AI

## Kiến trúc Hệ thống / System Architecture

### Microservices Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Chart Service  │    │  News Service   │
│   (React)       │◄──►│   (Node.js)     │    │   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │  AI Service     │
                       │                 │    │  (ML Models)    │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │Binance WebSocket│    │   Database      │
                       │  (Real-time)    │    │  (PostgreSQL)   │
                       └─────────────────┘    └─────────────────┘
```

## Chức năng Chính / Main Features

### 1. Biểu đồ và Dữ liệu Giá / Price Charts & Data
- **Real-time price charts**: Dữ liệu giá thời gian thực từ Binance WebSocket
- **Multi-timeframe support**: Hỗ trợ đa khung thời gian
- **Technical analysis tools**: Công cụ phân tích kỹ thuật (indicators, drawing tools)
- **Multiple chart view**: Xem đa biểu đồ đồng thời

### 2. Thu thập và Phân tích Tin tức / News Collection & Sentiment Analysis
- **Auto news crawling**: Tự động thu thập tin tức từ các trang web tài chính
- **AI-powered HTML analysis**: Sử dụng AI để phân tích cấu trúc HTML
- **Sentiment analysis**: Phân tích cảm xúc từ tin tức và diễn đàn

### 3. Dự đoán Xu hướng bằng AI / AI-Powered Trend Prediction
- **Machine Learning models**: Sử dụng mô hình AI dự đoán giá
- **Sentiment integration**: Tích hợp sentiment data để cải thiện độ chính xác
- **Real-time prediction**: Dự đoán giá đóng cửa của nến kế tiếp

### 4. Kiểm thử Chiến lược / Strategy Backtesting
- **Historical backtesting**: Kiểm thử chiến lược trên dữ liệu lịch sử
- **Custom model integration**: Hỗ trợ tải mô hình dự đoán tùy chỉnh
- **Strategy statistics**: Thống kê win/loss ratio, profit/loss

### 5. Quản lý Tài khoản / Account Management
- **User authentication**: Đăng ký, đăng nhập
- **Role-based access**: Phân quyền người dùng

### Mail
- Bad event notification: all subscribers (Design pattern: Observer, Pub/Sub, Event Bus)

## Công nghệ Sử dụng / Technology Stack

### Frontend
- **React + TypeScript**: Modern UI framework
- **TradingView Charting Library**: Professional charting solution
- **WebSocket**: Real-time data connection
- **Vite**: Fast build tool

### Backend
- **Node.js**: Chart service & API
- **Python**: AI service & sentiment analysis
- **Redis**: Real-time data caching
- **PostgreSQL**: Data persistence
- **Docker**: Containerization

### External APIs
- **Binance WebSocket API**: Real-time price data
- **Various news APIs**: Financial news sources

## Cấu trúc Project / Project Structure

```
realtimechart/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── services/        # API services
│   │   └── ...
│   └── package.json
├── char-service-backend/     # Node.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── ...
│   ├── Dockerfile
│   └── package.json
└── README.md
```

## Cài đặt và Chạy / Installation & Running

### Prerequisites
- Node.js (v16+)
- Docker & Docker Compose
- Redis
- PostgreSQL

### Backend Setup
```bash
cd char-service-backend
npm install
docker-compose up -d
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Kiến trúc Scalability / Scalability Architecture

### Xử lý 1000+ Concurrent Users
- **Redis Pub/Sub**: Phân phối data real-time
- **WebSocket connection pooling**: Quản lý kết nối hiệu quả
- **Microservices**: Tách biệt các service độc lập
- **Load balancing**: Cân bằng tải cho các service

### Data Flow
```
Binance WebSocket → Redis Cache → Multiple Client Connections
                                      ↓
                              WebSocket Manager
                                      ↓
                              Frontend Updates
```

## Yêu cầu Phi chức năng / Non-Functional Requirements

- **Performance**: Phản hồi < 100ms cho real-time data
- **Scalability**: Hỗ trợ 1000+ concurrent users
- **Security**: JWT authentication, data encryption
- **Maintainability**: Clean code, comprehensive documentation

## Kết quả Mong đợi / Expected Outcomes

1. **Prototype hoàn chỉnh**: Demonstrating core features
2. **Architecture documentation**: Detailed system design
3. **Performance analysis**: Trade-offs evaluation
4. **AI integration**: Sentiment + Price prediction

## Tài liệu Tham khảo / References

- [TradingView Chart Library](https://www.tradingview.com/chart/)
- [Binance WebSocket API](https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams)
- [Microservices Architecture Patterns](https://microservices.io/)

*Đồ án cuối kỳ môn Kiến trúc Phần mềm - Software Architecture Final Project*