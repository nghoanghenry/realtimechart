const amqplib = require('amqplib');
const { Server } = require('socket.io');
const axios = require('axios');

class WebSocketGateway {
  constructor(server) {
    this.io = new Server(server, { cors: { origin: '*' } });
    this.channel = null;
    this.subscribers = new Map(); // Track per-socket subscriptions
    this.baseUrl = 'https://api.binance.com/api/v3'; // ⭐ Added for direct API calls
    this.connectToRabbitMQ();
    this.setupSocketIO();
  }

  async connectToRabbitMQ() {
    try {
      const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
      this.channel = await conn.createChannel();
      await this.channel.assertExchange('kline_exchange', 'topic', { durable: true });
      const q = await this.channel.assertQueue('', { exclusive: true });
      await this.channel.bindQueue(q.queue, 'kline_exchange', '*.kline.*');
      console.log(`Gateway bound queue ${q.queue} to kline_exchange with routing key *.kline.*`);
      
      this.channel.consume(q.queue, async (msg) => {
        if (msg) {
          try {
            const data = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey; // VD: BTCUSDT.kline.1m
            const parts = routingKey.split('.');
            const symbol = parts[0];
            const interval = parts[2];
            
            if (data && 'timestamp' in data) {
              const formattedData = {
                symbol,
                data: {
                  timestamp: data.timestamp,
                  open: data.open,
                  high: data.high,
                  low: data.low,
                  close: data.close,
                  volume: data.volume,
                  isClosed: data.isClosed
                }
              };
              
              this.broadcastToSubscribers(symbol, interval, formattedData);
            }
            this.channel.ack(msg);
          } catch (error) {
            console.error(`Error parsing RabbitMQ message:`, error.message);
          }
        }
      }, { noAck: false });
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
      setTimeout(() => this.connectToRabbitMQ(), 5000);
    }
  }

  // ⭐ NEW: Fetch historical data directly from Binance API
  async getHistoricalData(symbol, interval = '1m', limit = 1000) {
    try {
      console.log(`🔄 Fetching fresh historical data for ${symbol} ${interval} (limit: ${limit})`);
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: { symbol, interval, limit },
        timeout: 10000
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

  broadcastToSubscribers(symbol, interval, data) {
    const subscriptionKey = `${symbol}:${interval}`;
    let sentCount = 0;
    
    this.io.sockets.sockets.forEach((socket) => {
      if (socket.subscriptions && socket.subscriptions.has(subscriptionKey)) {
        socket.emit('kline_update', data);
        sentCount++;
      }
    });
    
    if (sentCount > 0) {
      console.log(`📊 Broadcasted ${symbol} ${interval} update to ${sentCount} subscribed clients`);
    }
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.subscriptions = new Set();

      socket.on('subscribe', async ({ symbol, interval }) => {
        console.log(`Subscribe request: ${symbol} ${interval} from ${socket.id}`);
        
        try {
          const subscriptionKey = `${symbol}:${interval}`;
          
          // Add to socket's subscriptions
          socket.subscriptions.add(subscriptionKey);
          
          // ⭐ MODIFIED: Fetch fresh historical data from Binance API
          const data = await this.getHistoricalData(symbol, interval);
          
          console.log(`📈 Sending ${data.length} fresh historical bars for ${symbol} ${interval}`);
          socket.emit('historical_data', { symbol, data });
          
          socket.emit('subscribed', { symbol, interval });
          
          // Track global subscriptions for stream management
          if (!this.subscribers.has(subscriptionKey)) {
            this.subscribers.set(subscriptionKey, new Set());
          }
          this.subscribers.get(subscriptionKey).add(socket.id);
          
          console.log(`Client ${socket.id} subscribed to ${subscriptionKey}`);
          
        } catch (error) {
          console.error(`Subscription error for ${socket.id}:`, error);
          socket.emit('error', { message: 'Failed to subscribe' });
        }
      });

      socket.on('unsubscribe', ({ symbol, interval }) => {
        const subscriptionKey = `${symbol}:${interval}`;
        console.log(`Unsubscribe request: ${subscriptionKey} from ${socket.id}`);
        
        // Remove from socket's subscriptions
        if (socket.subscriptions) {
          socket.subscriptions.delete(subscriptionKey);
        }
        
        // Remove from global subscribers tracking
        if (this.subscribers.has(subscriptionKey)) {
          this.subscribers.get(subscriptionKey).delete(socket.id);
          
          // Clean up empty subscription groups
          if (this.subscribers.get(subscriptionKey).size === 0) {
            this.subscribers.delete(subscriptionKey);
          }
        }
        
        socket.emit('unsubscribed', { symbol, interval });
        console.log(`Client ${socket.id} unsubscribed from ${subscriptionKey}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Cleanup subscriptions when client disconnects
        if (socket.subscriptions) {
          socket.subscriptions.forEach((subscriptionKey) => {
            if (this.subscribers.has(subscriptionKey)) {
              this.subscribers.get(subscriptionKey).delete(socket.id);
              
              // Clean up empty subscription groups
              if (this.subscribers.get(subscriptionKey).size === 0) {
                this.subscribers.delete(subscriptionKey);
              }
            }
          });
        }
      });
    });
  }

  getSubscriptionStats() {
    const stats = {
      totalClients: this.io.sockets.sockets.size,
      activeSubscriptions: Array.from(this.subscribers.entries()).map(([key, sockets]) => ({
        subscription: key,
        subscriberCount: sockets.size
      })),
      totalSubscriptionGroups: this.subscribers.size
    };
    
    console.log('📊 Gateway Subscription Stats:', stats);
    return stats;
  }
}

module.exports = WebSocketGateway;