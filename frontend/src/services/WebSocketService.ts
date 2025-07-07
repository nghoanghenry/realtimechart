import { io, Socket } from 'socket.io-client';

export type KLineData = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed?: boolean;
};

export type SubscriptionCallback = (data: KLineData) => void;
export type HistoricalDataCallback = (data: KLineData[]) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private subscriptions = new Map<string, SubscriptionCallback[]>();
  private historicalCallbacks = new Map<string, HistoricalDataCallback>();
  private activeSubscriptions = new Set<string>();

  connect(url: string = 'http://localhost:3001') {
    if (this.socket?.connected) return;

    this.socket = io(url);

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('historical_data', (data: { symbol: string; data: KLineData[] }) => {
      const callback = this.historicalCallbacks.get(data.symbol);
      if (callback) {
        callback(data.data);
      }
    });

    this.socket.on('kline_update', (data: { symbol: string; data: KLineData }) => {
      console.log(`📊 WebSocket received data for ${data.symbol}:`, data.data);
      
      // Gửi data tới TẤT CẢ subscribers của symbol này
      const callbacks = this.subscriptions.get(data.symbol);
      if (callbacks && callbacks.length > 0) {
        callbacks.forEach((callback, index) => {
          console.log(`📈 Sending data to subscriber ${index + 1} for ${data.symbol}`);
          callback(data.data);
        });
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  subscribe(
    symbol: string, 
    interval: string = '1m',
    onUpdate: SubscriptionCallback,
    onHistoricalData?: HistoricalDataCallback
  ) {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    console.log(`🔔 Adding subscriber for ${symbol} ${interval}`);

    // Thêm callback vào array của subscribers
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, []);
    }
    this.subscriptions.get(symbol)!.push(onUpdate);

    if (onHistoricalData) {
      this.historicalCallbacks.set(symbol, onHistoricalData);
    }

    // Chỉ subscribe lên server NẾU chưa có subscription nào cho symbol này
    const subscriptionKey = `${symbol}_${interval}`;
    if (!this.activeSubscriptions.has(subscriptionKey)) {
      console.log(`📡 First subscription for ${symbol} ${interval} - subscribing to server`);
      this.activeSubscriptions.add(subscriptionKey);
      this.socket.emit('subscribe', { symbol, interval });
    } else {
      console.log(`🔄 Additional subscriber for existing ${symbol} ${interval} connection`);
    }
  }

  unsubscribe(symbol: string, interval: string = '1m') {
    if (!this.socket) return;

    console.log(`🔌 Removing subscriber for ${symbol} ${interval}`);

    // Remove một callback từ array
    const callbacks = this.subscriptions.get(symbol);
    if (callbacks && callbacks.length > 0) {
      callbacks.pop(); // Remove last subscriber
      
      // Nếu không còn subscribers nào cho symbol này
      if (callbacks.length === 0) {
        this.subscriptions.delete(symbol);
        this.historicalCallbacks.delete(symbol);
        
        const subscriptionKey = `${symbol}_${interval}`;
        this.activeSubscriptions.delete(subscriptionKey);
        
        console.log(`📡 No more subscribers for ${symbol} - unsubscribing from server`);
        this.socket.emit('unsubscribe', { symbol, interval });
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscriptions.clear();
    this.historicalCallbacks.clear();
    this.activeSubscriptions.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new WebSocketService();