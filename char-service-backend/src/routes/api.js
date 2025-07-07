const express = require('express');
const axios = require('axios');
const router = express.Router();
const redisClient = require('../redis');

router.get('/symbols', async (req, res) => {
  try {
    const cachedSymbols = await redisClient.get('symbols');
    if (cachedSymbols) {
      return res.json(JSON.parse(cachedSymbols));
    }

    const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    const symbols = response.data.symbols
      .filter(s => s.status === 'TRADING' && s.symbol.endsWith('USDT'))
      .slice(0, 50)
      .map(s => ({
        ticker: s.symbol,
        name: s.baseAsset,
        exchange: 'Binance',
        market: 'crypto',
        priceCurrency: s.quoteAsset,
        type: 'crypto'
      }));

    await redisClient.setEx('symbols', 3600, JSON.stringify(symbols));
    res.json(symbols);
  } catch (error) {
    console.error('Error fetching symbols:', error);
    res.status(500).json({ error: 'Failed to fetch symbols' });
  }
});

router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1m', limit = 1000 } = req.query;
    const cacheKey = `kline:${symbol}:${interval}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol, interval, limit }
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
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

module.exports = router;