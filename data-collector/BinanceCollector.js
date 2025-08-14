const WebSocket = require('ws');
const axios = require('axios');
const redisClient = require('./redis');
const amqp = require('amqplib');

class BinanceCollector {
  constructor() {
    this.connections = new Map();
    this.baseUrl = 'https://api.binance.com/api/v3';
    this.wsUrl = 'wss://stream.binance.com:9443/ws';
    this.rabbitConn = null;
    this.channel = null;
    this.activeStreams = new Set(); // Track which streams are being used
    this.connectToRabbitMQ();
  }

  async connectToRabbitMQ() {
    try {
      this.rabbitConn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
      this.channel = await this.rabbitConn.createChannel();
      await this.channel.assertExchange('kline_exchange', 'topic', { durable: true });
      console.log('Connected to RabbitMQ and asserted kline_exchange');
    } catch (error) {
      console.error('RabbitMQ connection error:', error.message);
      setTimeout(() => this.connectToRabbitMQ(), 5000);
    }
  }

  async getHistoricalData(symbol, interval = '1m', limit = 1000) {
    const cacheKey = `kline:${symbol}:${interval}`;
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for ${cacheKey}: ${cachedData.length} chars`);
        return JSON.parse(cachedData);
      }

      console.log(`Fetching historical data for ${symbol} ${interval}`);
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: { symbol, interval, limit },
        timeout: 5000
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
      console.log(`Cached ${data.length} bars for ${cacheKey}`);
      return data;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol} ${interval}:`, error.message);
      return [];
    }
  }

  async updateKlineCache(streamName, klineData) {
    // ⭐ FIXED: Only update cache when kline is closed (like monolithic)
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
      if (klines.length > 1000) klines.shift();
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(klines));
      console.log(`Updated cache for ${cacheKey} (closed kline)`);
    } catch (error) {
      console.error(`Error updating kline cache for ${cacheKey}:`, error.message);
    }
  }

  createBinanceConnection(streamName) {
    const ws = new WebSocket(`${this.wsUrl}/${streamName}`);

    ws.on('open', () => {
      console.log(`Connected to Binance stream: ${streamName}`);
    });

    ws.on('message', async (data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.e !== 'kline') {
          return;
        }
        if (parsed.k) {
          const kline = parsed.k;
          const klineData = {
            timestamp: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            isClosed: kline.x  // ⭐ FIXED: Add isClosed field like monolithic
          };

          // Always update cache (respects isClosed check inside)
          await this.updateKlineCache(streamName, klineData);

          // ⭐ FIXED: Always publish to RabbitMQ (both closed and open klines)
          // This matches monolithic behavior that sends all updates
          if (this.channel) {
            const [symbol, interval] = streamName.split('@');
            const routingKey = `${symbol.toUpperCase()}.kline.${interval.replace('kline_', '')}`;
            this.channel.publish('kline_exchange', routingKey, Buffer.from(JSON.stringify(klineData)));
          }
        }
      } catch (error) {
        console.error(`Error parsing Binance data for ${streamName}:`, error.message);
      }
    });

    ws.on('close', () => {
      console.log(`Disconnected from Binance stream: ${streamName}`);
      this.connections.delete(streamName);
      // ⭐ FIXED: Only reconnect if stream is still actively needed
      if (this.activeStreams.has(streamName)) {
        setTimeout(() => this.createBinanceConnection(streamName), 5000);
      }
    });

    ws.on('error', (error) => {
      console.error(`Binance WebSocket error for ${streamName}:`, error.message);
    });

    this.connections.set(streamName, ws);
  }

  subscribeToStream(symbol, interval) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    this.activeStreams.add(streamName); // Mark as actively needed
    
    if (!this.connections.has(streamName)) {
      console.log(`Subscribing to ${streamName}`);
      this.createBinanceConnection(streamName);
    }
  }

  // ⭐ NEW: Add method to unsubscribe (for dynamic management)
  unsubscribeFromStream(symbol, interval) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    this.activeStreams.delete(streamName);
    
    // Close connection if no longer needed
    const ws = this.connections.get(streamName);
    if (ws) {
      ws.close();
      this.connections.delete(streamName);
      console.log(`Unsubscribed and closed connection for ${streamName}`);
    }
  }

  // ⭐ NEW: Get active streams info
  getActiveStreams() {
    return {
      activeStreams: Array.from(this.activeStreams),
      connections: Array.from(this.connections.keys()),
      totalConnections: this.connections.size
    };
  }
}

module.exports = BinanceCollector;