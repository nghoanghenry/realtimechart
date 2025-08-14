const amqplib = require('amqplib');
const { Server } = require('socket.io');
const redisClient = require('./redis');

class WebSocketGateway {
  constructor(server) {
    this.io = new Server(server, { cors: { origin: '*' } });
    this.channel = null;
    this.subscribers = new Map(); // ⭐ Track per-socket subscriptions like monolithic
    this.redisClient = redisClient; // ⭐ FIXED: Expose Redis client for external access
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
                  isClosed: data.isClosed  // ⭐ FIXED: Include isClosed field
                }
              };
              
              // ⭐ FIXED: Only emit to subscribed clients (like monolithic)
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

  // ⭐ NEW: Broadcast only to subscribed clients (matching monolithic behavior)
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
      
      // ⭐ FIXED: Initialize per-socket subscriptions (like monolithic)
      socket.subscriptions = new Set();

      socket.on('subscribe', async ({ symbol, interval }) => {
        console.log(`Subscribe request: ${symbol} ${interval} from ${socket.id}`);
        
        try {
          const subscriptionKey = `${symbol}:${interval}`;
          
          // Add to socket's subscriptions
          socket.subscriptions.add(subscriptionKey);
          
          // Send historical data
          const cacheKey = `kline:${symbol}:${interval}`;
          const cachedData = await this.redisClient.get(cacheKey);
          const data = cachedData ? JSON.parse(cachedData) : [];
          
          console.log(`Sending ${data.length} historical bars for ${cacheKey}`);
          socket.emit('historical_data', { symbol, data });
          
          // ⭐ FIXED: Send subscription acknowledgment (like monolithic)
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
        
        // ⭐ FIXED: Send unsubscription acknowledgment (like monolithic)
        socket.emit('unsubscribed', { symbol, interval });
        console.log(`Client ${socket.id} unsubscribed from ${subscriptionKey}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // ⭐ FIXED: Cleanup subscriptions when client disconnects (like monolithic)
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

  // ⭐ NEW: Get subscription statistics (for monitoring)
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