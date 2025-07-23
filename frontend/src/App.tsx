import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SingleChartPage from './pages/SingleChartPage';
import MultiChartGridPage from './pages/MultiChartGridPage';
import MultiChartPage from './pages/MultiChartPage';
import BacktestPage from './pages/BacktestPage';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Header />
      
      <Routes>
        <Route path="/" element={<SingleChartPage />} />
        <Route path="/multichart" element={<MultiChartGridPage />} />
        <Route path="/multitimeframechart" element={<MultiChartPage />} />
        <Route path="/backtest" element={<BacktestPage />} />
      </Routes>
    </div>
  );
}