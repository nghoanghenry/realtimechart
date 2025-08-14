const BinanceCollector = require('./BinanceCollector');
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
      
      // Listen for subscription management commands from gateway
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
      
      // ⭐ SIMPLIFIED: Only start real-time subscription, no cache initialization
      console.log(`🔄 Starting stream for ${symbol} ${interval}`);
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

  // ⭐ REMOVED: No longer need to initialize popular symbols cache

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

// ⭐ REMOVED: No cache initialization on startup

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔌 Shutting down collector...');
  
  try {
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