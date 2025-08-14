const WebSocket = require('ws');
const axios = require('axios');
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

  // ⭐ MODIFIED: Always fetch from Binance API, no caching
  async getHistoricalData(symbol, interval = '1m', limit = 1000) {
    try {
      console.log(`🔄 Fetching fresh historical data for ${symbol} ${interval} (limit: ${limit})`);
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: { symbol, interval, limit },
        timeout: 10000 // Increased timeout for reliability
      });
      
      const data = response.data.map(kline => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
      
      console.log(`📈 Retrieved ${data.length} fresh bars for ${symbol} ${interval}`);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching historical data for ${symbol} ${interval}:`, error.message);
      return [];
    }
  }

  // ⭐ REMOVED: No longer need cache update method since we don't cache

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
            isClosed: kline.x
          };

          // ⭐ SIMPLIFIED: Only publish to RabbitMQ, no cache updates
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
      // Only reconnect if stream is still actively needed
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
      console.log(`🚀 Subscribing to ${streamName}`);
      this.createBinanceConnection(streamName);
    }
  }

  unsubscribeFromStream(symbol, interval) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    this.activeStreams.delete(streamName);
    
    // Close connection if no longer needed
    const ws = this.connections.get(streamName);
    if (ws) {
      ws.close();
      this.connections.delete(streamName);
      console.log(`🔌 Unsubscribed and closed connection for ${streamName}`);
    }
  }

  getActiveStreams() {
    return {
      activeStreams: Array.from(this.activeStreams),
      connections: Array.from(this.connections.keys()),
      totalConnections: this.connections.size
    };
  }
}

module.exports = BinanceCollector;