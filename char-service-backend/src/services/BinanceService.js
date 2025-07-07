const WebSocket = require('ws');
const axios = require('axios');
const redisClient = require('../redis');

class BinanceService {
  constructor() {
    this.connections = new Map();
    this.subscribers = new Map();
    this.baseUrl = 'https://api.binance.com/api/v3';
    this.wsUrl = 'wss://stream.binance.com:9443/ws';
  }

  async getHistoricalData(symbol, interval = '1m', limit = 1000) {
    const cacheKey = `kline:${symbol}:${interval}`;
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: { symbol, interval, limit }
      });
      const data = response.data.map(kline => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  async updateKlineCache(streamName, klineData) {
    if (!klineData.isClosed) return;

    const [symbol, interval] = streamName.split('@');
    const cacheKey = `kline:${symbol.toUpperCase()}:${interval.replace('kline_', '')}`;
    try {
      const cachedData = await redisClient.get(cacheKey);
      let klines = cachedData ? JSON.parse(cachedData) : [];

      klines.push({
        timestamp: klineData.timestamp,
        open: klineData.open,
        high: klineData.high,
        low: klineData.low,
        close: klineData.close,
        volume: klineData.volume
      });
      if (klines.length > 1000) {
        klines.shift();
      }

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(klines));
    } catch (error) {
      console.error('Error updating kline cache:', error);
    }
  }

  createBinanceConnection(streamName, callback) {
    const ws = new WebSocket(`${this.wsUrl}/${streamName}`);
    
    ws.on('open', () => {
      console.log(`Connected to Binance stream: ${streamName}`);
    });

    ws.on('message', async (data) => {
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

          await this.updateKlineCache(streamName, klineData);

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

  subscribe(socketId, symbol, interval, callback) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    
    if (!this.subscribers.has(streamName)) {
      this.subscribers.set(streamName, new Set());
      this.createBinanceConnection(streamName, callback);
    }
    
    this.subscribers.get(streamName).add(socketId);
    console.log(`Client ${socketId} subscribed to ${streamName}`);
  }

  unsubscribe(socketId, symbol, interval) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    
    if (this.subscribers.has(streamName)) {
      this.subscribers.get(streamName).delete(socketId);
      if (this.subscribers.get(streamName).size === 0) {
        this.closeBinanceConnection(streamName);
      }
    }
    console.log(`Client ${socketId} unsubscribed from ${streamName}`);
  }

  closeBinanceConnection(streamName) {
    const ws = this.connections.get(streamName);
    if (ws) {
      ws.close();
      this.connections.delete(streamName);
      this.subscribers.delete(streamName);
    }
  }

  cleanupClient(socketId) {
    this.subscribers.forEach((subscribers, streamName) => {
      if (subscribers.has(socketId)) {
        this.unsubscribe(socketId, streamName.split('@')[0], streamName.split('@')[1].replace('kline_', ''));
      }
    });
  }
}

module.exports = BinanceService;