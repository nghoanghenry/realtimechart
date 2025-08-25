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
    this.activeStreams = new Set();
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

  // ⭐ MODIFIED: Add all required fields from Binance API
  async getHistoricalData(symbol, interval = '1m', limit = 1000, startTime = null, endTime = null) {
    try {
      console.log(`📄 Fetching fresh historical data for ${symbol} ${interval} (limit: ${limit})`);
      
      const params = { symbol, interval, limit };
      
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;
      
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params,
        timeout: 10000
      });
      
      const data = response.data.map(kline => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        close_time: kline[6],
        quote_asset_volume: parseFloat(kline[7]),
        number_of_trade: parseInt(kline[8]),
        taker_buy_base_asset_volume: parseFloat(kline[9]),
        taker_buy_quote_asset_volume: parseFloat(kline[10])
      }));
      
      console.log(`📈 Retrieved ${data.length} fresh bars for ${symbol} ${interval}`);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching historical data for ${symbol} ${interval}:`, error.message);
      return [];
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
          // ⭐ MODIFIED: Add all required fields from WebSocket stream
          const klineData = {
            timestamp: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            close_time: kline.T,
            quote_asset_volume: parseFloat(kline.q),
            number_of_trade: parseInt(kline.n),
            taker_buy_base_asset_volume: parseFloat(kline.V),
            taker_buy_quote_asset_volume: parseFloat(kline.Q),
            isClosed: kline.x
          };

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
    this.activeStreams.add(streamName);
    
    if (!this.connections.has(streamName)) {
      console.log(`🚀 Subscribing to ${streamName}`);
      this.createBinanceConnection(streamName);
    }
  }

  unsubscribeFromStream(symbol, interval) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    this.activeStreams.delete(streamName);
    
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