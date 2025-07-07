const express = require('express');
const http = require('http');
const cors = require('cors');
const axios = require('axios');
const WebSocketManager = require('./services/WebSocketManager');
const apiRoutes = require('./routes/api');
const redisClient = require('./redis');
const BinanceService = require('./services/BinanceService');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Khởi tạo cache cho các symbol và channel phổ biến
async function initializeCache() {
  const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  const intervals = ['1m', '5m'];
  const binanceService = new BinanceService();
  for (const symbol of popularSymbols) {
    for (const interval of intervals) {
      await binanceService.getHistoricalData(symbol, interval);
    }
  }
  await axios.get('http://localhost:3001/api/symbols').catch(err => console.error('Error initializing symbols cache:', err));
}

const wsManager = new WebSocketManager(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket ready for connections`);
  initializeCache();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redisClient.quit();
  server.close(() => {
    console.log('Process terminated');
  });
});