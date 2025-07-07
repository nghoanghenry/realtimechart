const { Server } = require('socket.io');
const BinanceService = require('./BinanceService');

class WebSocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.binanceService = new BinanceService();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe', async (data) => {
        const { symbol, interval } = data;
        console.log(`Subscribe request: ${symbol} ${interval} from ${socket.id}`);

        try {
          const historicalData = await this.binanceService.getHistoricalData(symbol, interval);
          socket.emit('historical_data', { symbol, data: historicalData });

          this.binanceService.subscribe(
            socket.id, 
            symbol, 
            interval, 
            (socketId, streamName, klineData) => {
              const targetSocket = this.io.sockets.sockets.get(socketId);
              if (targetSocket) {
                targetSocket.emit('kline_update', { symbol, data: klineData });
              }
            }
          );

          socket.emit('subscribed', { symbol, interval });
        } catch (error) {
          console.error('Subscription error:', error);
          socket.emit('error', { message: 'Failed to subscribe' });
        }
      });

      socket.on('unsubscribe', (data) => {
        const { symbol, interval } = data;
        this.binanceService.unsubscribe(socket.id, symbol, interval);
        socket.emit('unsubscribed', { symbol, interval });
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.binanceService.cleanupClient(socket.id);
      });
    });
  }

  getIO() {
    return this.io;
  }
}

module.exports = WebSocketManager;