const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get available symbols
router.get('/symbols', async (req, res) => {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    const symbols = response.data.symbols
      .filter(s => s.status === 'TRADING' && s.symbol.endsWith('USDT'))
      .slice(0, 50) // Top 50 symbols
      .map(s => ({
        ticker: s.symbol,
        name: s.baseAsset,
        exchange: 'Binance',
        market: 'crypto',
        priceCurrency: s.quoteAsset,
        type: 'crypto'
      }));
    
    res.json(symbols);
  } catch (error) {
    console.error('Error fetching symbols:', error);
    res.status(500).json({ error: 'Failed to fetch symbols' });
  }
});

// Get historical data
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1m', limit = 1000 } = req.query;
    
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
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

module.exports = router;