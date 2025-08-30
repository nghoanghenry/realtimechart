import { Brain, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function PredictionBlock() {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const result = await fetch(
          "http://localhost:5001/predict/?symbol=BTCUSDT&interval=1h&limit=1"
        );

        if (!result.ok) {
          throw new Error("Failed to fetch prediction");
        }

        const data = await result.json();
        console.log("Prediction data:", data?.prediction?.[0] ?? 0);

        setPrediction(data?.prediction?.[0] ?? 0);
      } catch {
        console.error("Error fetching prediction");
      }
    };

    const fetchCurrentPrice = async () => {
      try {
        const result = await fetch(
          "http://localhost/api/history/BTCUSDT?interval=1h&limit=1"
        );

        if (!result.ok) {
          throw new Error("Failed to fetch current price");
        }
        const data = await result.json();
        console.log("Current price data:", data?.[0].close ?? 0);

        setCurrentPrice(data?.[0].close ?? 0);
      } catch {
        console.error("Error fetching current price");
      }
    };

    fetchPrediction();
    fetchCurrentPrice();
  }, []);

  const formatter = Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="rounded-xl shadow-lg min-h-[10rem] w-full p-4 border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80">
      <div className="flex gap-1 w-full items-center">
        <Brain size={20} />
        <h2 className="text-lg font-semibold m-0">ML Prediction</h2>
      </div>
      <p className="text-gray-400 text-sm m-0">AI-Powered Forecast</p>
      <p className="w-full text-center text-gray-700 font-medium mt-2 text-lg">
        Next price
      </p>
      {prediction !== null && (
        <div
          className={`flex justify-center items-center gap-2 ${
            prediction > currentPrice! ? "text-green-500" : "text-red-500"
          }`}
        >
          <p className="font-medium text-2xl w-max">
            {formatter.format(prediction)} USDT
          </p>
          {prediction > currentPrice! ? (
            <TrendingUp size={18} className="mt-1" />
          ) : (
            <TrendingDown size={18} className="mt-1" />
          )}
        </div>
      )}
    </div>
  );
}
