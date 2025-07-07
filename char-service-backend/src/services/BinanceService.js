const WebSocket = require('ws');
const axios = require('axios');

class BinanceService {
  constructor() {
    this.connections = new Map(); // symbol -> WebSocket
    this.subscribers = new Map(); // symbol -> Set<socketId>
    this.baseUrl = 'https://api.binance.com/api/v3';
    this.wsUrl = 'wss://stream.binance.com:9443/ws';
  }

  // Lấy dữ liệu lịch sử
  async getHistoricalData(symbol, interval = '1m', limit = 1000) {
    try {
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: { symbol, interval, limit }
      });
      
      return response.data.map(kline => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  // Đăng ký nhận data realtime
  subscribe(socketId, symbol, interval, callback) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    
    if (!this.subscribers.has(streamName)) {
      this.subscribers.set(streamName, new Set());
      this.createBinanceConnection(streamName, callback);
    }
    
    this.subscribers.get(streamName).add(socketId);
    console.log(`Client ${socketId} subscribed to ${streamName}`);
  }

  // Hủy đăng ký
  unsubscribe(socketId, symbol, interval) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    
    if (this.subscribers.has(streamName)) {
      this.subscribers.get(streamName).delete(socketId);
      
      // Nếu không còn subscribers nào, đóng connection
      if (this.subscribers.get(streamName).size === 0) {
        this.closeBinanceConnection(streamName);
      }
    }
    console.log(`Client ${socketId} unsubscribed from ${streamName}`);
  }

  // Tạo kết nối tới Binance
  createBinanceConnection(streamName, callback) {
    const ws = new WebSocket(`${this.wsUrl}/${streamName}`);
    
    ws.on('open', () => {
      console.log(`Connected to Binance stream: ${streamName}`);
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.k) {
          const kline = parsed.k;
          const klineData = {
            timestamp: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            isClosed: kline.x
          };

          // Broadcast tới tất cả subscribers
          const subscribers = this.subscribers.get(streamName) || new Set();
          subscribers.forEach(socketId => {
            callback(socketId, streamName, klineData);
          });
        }
      } catch (error) {
        console.error('Error parsing Binance data:', error);
      }
    });

    ws.on('close', () => {
      console.log(`Disconnected from Binance stream: ${streamName}`);
      this.connections.delete(streamName);
    });

    ws.on('error', (error) => {
      console.error(`Binance WebSocket error for ${streamName}:`, error);
    });

    this.connections.set(streamName, ws);
  }

  // Đóng kết nối Binance
  closeBinanceConnection(streamName) {
    const ws = this.connections.get(streamName);
    if (ws) {
      ws.close();
      this.connections.delete(streamName);
      this.subscribers.delete(streamName);
    }
  }

  // Cleanup khi client disconnect
  cleanupClient(socketId) {
    this.subscribers.forEach((subscribers, streamName) => {
      if (subscribers.has(socketId)) {
        this.unsubscribe(socketId, streamName.split('@')[0], streamName.split('@')[1].replace('kline_', ''));
      }
    });
  }
}

module.exports = BinanceService;