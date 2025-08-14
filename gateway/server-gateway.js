const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocketGateway = require('./WebSocketGateway');
const amqp = require('amqplib');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Stream management communication with collector
class StreamCoordinator {
  constructor() {
    this.rabbitConn = null;
    this.channel = null;
    this.connectToRabbitMQ();
  }

  async connectToRabbitMQ() {
    try {
      this.rabbitConn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
      this.channel = await this.rabbitConn.createChannel();
      await this.channel.assertExchange('stream_management', 'direct', { durable: true });
      await this.channel.assertQueue('stream_requests', { durable: true });
      console.log('✅ Gateway connected to stream management');
    } catch (error) {
      console.error('❌ Gateway RabbitMQ connection error:', error.message);
      setTimeout(() => this.connectToRabbitMQ(), 5000);
    }
  }

  async requestStreamStart(symbol, interval) {
    if (this.channel) {
      const message = { action: 'subscribe', symbol, interval };
      this.channel.sendToQueue('stream_requests', Buffer.from(JSON.stringify(message)));
      console.log(`📤 Requested stream start: ${symbol} ${interval}`);
    }
  }

  async requestStreamStop(symbol, interval) {
    if (this.channel) {
      const message = { action: 'unsubscribe', symbol, interval };
      this.channel.sendToQueue('stream_requests', Buffer.from(JSON.stringify(message)));
      console.log(`📤 Requested stream stop: ${symbol} ${interval}`);
    }
  }
}

const streamCoordinator = new StreamCoordinator();

// Enhanced WebSocketGateway with stream coordination
class EnhancedWebSocketGateway extends WebSocketGateway {
  constructor(server, coordinator) {
    super(server);
    this.coordinator = coordinator;
    this.subscriptionCounts = new Map(); // Track how many clients per stream
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      socket.subscriptions = new Set();

      socket.on('subscribe', async ({ symbol, interval }) => {
        console.log(`🔥 Subscribe request: ${symbol} ${interval} from ${socket.id}`);
        
        try {
          const subscriptionKey = `${symbol}:${interval}`;
          
          // Add to socket's subscriptions
          socket.subscriptions.add(subscriptionKey);
          
          // Track subscription counts and coordinate with collector
          if (!this.subscriptionCounts.has(subscriptionKey)) {
            this.subscriptionCounts.set(subscriptionKey, 1);
            // First subscriber - request stream start
            await this.coordinator.requestStreamStart(symbol, interval);
          } else {
            const count = this.subscriptionCounts.get(subscriptionKey) + 1;
            this.subscriptionCounts.set(subscriptionKey, count);
            console.log(`➕ Additional subscriber for ${subscriptionKey} (total: ${count})`);
          }
          
          // ⭐ MODIFIED: Fetch fresh historical data directly from API
          const data = await this.getHistoricalData(symbol, interval);
          
          console.log(`📈 Sending ${data.length} fresh historical bars for ${symbol} ${interval}`);
          socket.emit('historical_data', { symbol, data });
          
          // Send subscription acknowledgment
          socket.emit('subscribed', { symbol, interval });
          
          // Track global subscriptions for broadcasting
          if (!this.subscribers.has(subscriptionKey)) {
            this.subscribers.set(subscriptionKey, new Set());
          }
          this.subscribers.get(subscriptionKey).add(socket.id);
          
        } catch (error) {
          console.error(`❌ Subscription error for ${socket.id}:`, error);
          socket.emit('error', { message: 'Failed to subscribe' });
        }
      });

      socket.on('unsubscribe', async ({ symbol, interval }) => {
        const subscriptionKey = `${symbol}:${interval}`;
        console.log(`🔥 Unsubscribe request: ${subscriptionKey} from ${socket.id}`);
        
        await this.handleUnsubscribe(socket, subscriptionKey, symbol, interval);
        socket.emit('unsubscribed', { symbol, interval });
      });

      socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Cleanup all subscriptions for this socket
        if (socket.subscriptions) {
          for (const subscriptionKey of socket.subscriptions) {
            const [symbol, interval] = subscriptionKey.split(':');
            await this.handleUnsubscribe(socket, subscriptionKey, symbol, interval);
          }
        }
      });
    });
  }

  async handleUnsubscribe(socket, subscriptionKey, symbol, interval) {
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
    
    // Coordinate with collector for stream management
    if (this.subscriptionCounts.has(subscriptionKey)) {
      const count = this.subscriptionCounts.get(subscriptionKey) - 1;
      
      if (count <= 0) {
        this.subscriptionCounts.delete(subscriptionKey);
        // Last subscriber - request stream stop
        await this.coordinator.requestStreamStop(symbol, interval);
        console.log(`🔌 Last subscriber removed for ${subscriptionKey} - stopping stream`);
      } else {
        this.subscriptionCounts.set(subscriptionKey, count);
        console.log(`➖ Subscriber removed from ${subscriptionKey} (remaining: ${count})`);
      }
    }
  }

  // Enhanced stats with coordination info
  getEnhancedStats() {
    return {
      ...this.getSubscriptionStats(),
      subscriptionCounts: Array.from(this.subscriptionCounts.entries()).map(([key, count]) => ({
        subscription: key,
        count
      })),
      coordinatorConnected: this.coordinator.channel ? true : false
    };
  }
}

// Initialize enhanced gateway
const wsGateway = new EnhancedWebSocketGateway(server, streamCoordinator);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    gateway: 'enhanced-no-cache'
  });
});

// Detailed health endpoint
app.get('/health/detailed', (req, res) => {
  const stats = wsGateway.getEnhancedStats();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    ...stats
  });
});

// Symbols endpoint
app.get('/api/symbols', (req, res) => {
  const symbols = [
    { ticker: 'BTCUSDT', name: 'Bitcoin', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'ETHUSDT', name: 'Ethereum', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'BNBUSDT', name: 'BNB', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'ADAUSDT', name: 'Cardano', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'SOLUSDT', name: 'Solana', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'XRPUSDT', name: 'Ripple', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'DOTUSDT', name: 'Polkadot', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'DOGEUSDT', name: 'Dogecoin', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'SHIBUSDT', name: 'Shiba Inu', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'AVAXUSDT', name: 'Avalanche', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'MATICUSDT', name: 'Polygon', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'LINKUSDT', name: 'Chainlink', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'UNIUSDT', name: 'Uniswap', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'LTCUSDT', name: 'Litecoin', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'BCHUSDT', name: 'Bitcoin Cash', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'ATOMUSDT', name: 'Cosmos', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'FILUSDT', name: 'Filecoin', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'TRXUSDT', name: 'TRON', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'ETCUSDT', name: 'Ethereum Classic', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
    { ticker: 'XLMUSDT', name: 'Stellar', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' }
  ];
  res.json(symbols);
});

// ⭐ MODIFIED: API endpoint to get fresh historical data from Binance
app.get('/api/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1m', limit = 1000 } = req.query;

    // Always fetch fresh data from Binance API
    const data = await wsGateway.getHistoricalData(symbol, interval, parseInt(limit));
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Stream management endpoints for debugging
app.get('/api/streams', (req, res) => {
  const stats = wsGateway.getEnhancedStats();
  res.json(stats);
});

app.post('/api/streams/force-start/:symbol/:interval', async (req, res) => {
  const { symbol, interval } = req.params;
  try {
    await streamCoordinator.requestStreamStart(symbol, interval);
    res.json({ message: `Requested start for ${symbol}:${interval}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/streams/force-stop/:symbol/:interval', async (req, res) => {
  const { symbol, interval } = req.params;
  try {
    await streamCoordinator.requestStreamStop(symbol, interval);
    res.json({ message: `Requested stop for ${symbol}:${interval}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Enhanced Gateway (No Cache) running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Detailed stats: http://localhost:${PORT}/health/detailed`);
  console.log(`🎯 Stream management: http://localhost:${PORT}/api/streams`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔌 Gateway shutting down...');
  
  try {
    if (streamCoordinator.rabbitConn) {
      await streamCoordinator.rabbitConn.close();
    }
    server.close(() => {
      console.log('✅ Gateway shutdown complete');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Gateway shutdown error:', error);
    process.exit(1);
  }
});

// Log stats periodically
setInterval(() => {
  const stats = wsGateway.getEnhancedStats();
  if (stats.totalClients > 0) {
    console.log(`📊 Gateway Stats: ${stats.totalClients} clients, ${stats.totalSubscriptionGroups} active streams`);
  }
}, 30000); // Every 30 seconds