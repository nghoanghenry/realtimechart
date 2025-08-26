import { Brain, TrendingUp } from "lucide-react";

export default function PredictionBlock() {
  return (
    <div className="rounded-xl shadow-lg min-h-[10rem] w-full p-4 border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80">
      <div className="flex gap-1 w-full items-center">
        <Brain size={20} />
        <h2 className="text-lg font-semibold m-0">ML Prediction</h2>
      </div>
      <p className="text-gray-400 text-sm m-0">AI-Powered Forecast</p>
      <p className="w-full text-center text-gray-700 font-medium mt-2 text-lg">
        Giá tiếp theo
      </p>
      <div className="flex justify-center items-center text-green-500 gap-2">
        <p className="font-medium text-2xl w-max">
          110,250.00 USDT
        </p>
        <TrendingUp size={18}/>
      </div>
    </div>
  );
}
