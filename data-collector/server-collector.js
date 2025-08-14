const BinanceCollector = require('./BinanceCollector');
const redisClient = require('./redis');
const amqp = require('amqplib');

class StreamManager {
  constructor() {
    this.collector = new BinanceCollector();
    this.rabbitConn = null;
    this.channel = null;
    this.activeSubscriptions = new Map(); // Track demand from gateway
    this.connectToRabbitMQ();
  }

  async connectToRabbitMQ() {
    try {
      this.rabbitConn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
      this.channel = await this.rabbitConn.createChannel();
      
      // ⭐ NEW: Listen for subscription management commands from gateway
      await this.channel.assertExchange('stream_management', 'direct', { durable: true });
      const q = await this.channel.assertQueue('stream_requests', { durable: true });
      
      this.channel.consume(q.queue, async (msg) => {
        if (msg) {
          try {
            const { action, symbol, interval } = JSON.parse(msg.content.toString());
            
            if (action === 'subscribe') {
              await this.handleSubscribeRequest(symbol, interval);
            } else if (action === 'unsubscribe') {
              await this.handleUnsubscribeRequest(symbol, interval);
            }
            
            this.channel.ack(msg);
          } catch (error) {
            console.error('Error processing stream management message:', error);
          }
        }
      });
      
      console.log('✅ Connected to RabbitMQ for stream management');
    } catch (error) {
      console.error('❌ RabbitMQ connection error:', error.message);
      setTimeout(() => this.connectToRabbitMQ(), 5000);
    }
  }

  async handleSubscribeRequest(symbol, interval) {
    const streamKey = `${symbol}:${interval}`;
    
    if (!this.activeSubscriptions.has(streamKey)) {
      this.activeSubscriptions.set(streamKey, 1);
      
      // Initialize historical data if not cached
      console.log(`🔄 Initializing stream for ${symbol} ${interval}`);
      const data = await this.collector.getHistoricalData(symbol, interval);
      console.log(`📈 Cached ${data.length} bars for ${streamKey}`);
      
      // Start real-time subscription
      this.collector.subscribeToStream(symbol, interval);
      console.log(`🚀 Started real-time stream for ${streamKey}`);
      
    } else {
      // Increment subscriber count
      const count = this.activeSubscriptions.get(streamKey) + 1;
      this.activeSubscriptions.set(streamKey, count);
      console.log(`➕ Additional subscriber for ${streamKey} (total: ${count})`);
    }
  }

  async handleUnsubscribeRequest(symbol, interval) {
    const streamKey = `${symbol}:${interval}`;
    
    if (this.activeSubscriptions.has(streamKey)) {
      const count = this.activeSubscriptions.get(streamKey) - 1;
      
      if (count <= 0) {
        // No more subscribers, stop the stream
        this.activeSubscriptions.delete(streamKey);
        this.collector.unsubscribeFromStream(symbol, interval);
        console.log(`🔌 Stopped stream for ${streamKey} (no more subscribers)`);
      } else {
        this.activeSubscriptions.set(streamKey, count);
        console.log(`➖ Subscriber removed from ${streamKey} (remaining: ${count})`);
      }
    }
  }

  async initializePopularSymbols() {
    // ⭐ CHANGED: Only initialize cache, don't auto-subscribe to streams
    const popularSymbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT',
      'DOGEUSDT', 'SHIBUSDT', 'AVAXUSDT', 'MATICUSDT', 'LINKUSDT', 'UNIUSDT',
      'LTCUSDT', 'BCHUSDT', 'ATOMUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'XLMUSDT'
    ];
    const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
    
    console.log('🔄 Pre-loading historical data cache...');
    
    for (const symbol of popularSymbols) {
      for (const interval of intervals) {
        try {
          const data = await this.collector.getHistoricalData(symbol, interval);
          console.log(`📦 Pre-cached ${data.length} bars for ${symbol} ${interval}`);
        } catch (error) {
          console.error(`❌ Failed to cache ${symbol} ${interval}:`, error.message);
        }
      }
    }
    
    console.log('✅ Historical data cache initialization complete');
  }

  // Monitoring and stats
  getStats() {
    const stats = {
      activeSubscriptions: Array.from(this.activeSubscriptions.entries()).map(([stream, count]) => ({
        stream,
        subscribers: count
      })),
      totalStreams: this.activeSubscriptions.size,
      collectorStats: this.collector.getActiveStreams()
    };
    
    console.log('📊 Collector Stats:', stats);
    return stats;
  }

  // Health check
  async healthCheck() {
    return {
      status: 'OK',
      rabbitMQ: this.channel ? 'connected' : 'disconnected',
      activeStreams: this.activeSubscriptions.size,
      collectorConnections: this.collector.getActiveStreams().totalConnections,
      timestamp: new Date().toISOString()
    };
  }
}

// Initialize stream manager
const streamManager = new StreamManager();

// Initialize cache on startup
streamManager.initializePopularSymbols().catch(error => {
  console.error('❌ Initialization error:', error.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔌 Shutting down collector...');
  
  try {
    await redisClient.quit();
    if (streamManager.rabbitConn) {
      await streamManager.rabbitConn.close();
    }
    if (streamManager.collector.rabbitConn) {
      await streamManager.collector.rabbitConn.close();
    }
    console.log('✅ Graceful shutdown complete');
  } catch (error) {
    console.error('❌ Shutdown error:', error);
  }
  
  process.exit(0);
});

// Health monitoring endpoint data
setInterval(() => {
  streamManager.getStats();
}, 60000); // Log stats every minute