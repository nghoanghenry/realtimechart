"use client"

import { useState } from "react"
import CustomProChart from "../components/CustomProChart"
import SentimentNews from "../components/SentimentNews"
import PredictionBlock from "../components/PredictionBlock"
import { TrendingUp, BarChart3, Rows as News, Settings, ChevronRight } from "lucide-react"

export default function SingleChartPage() {
  const [selectedSymbol] = useState("BTCUSDT")
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const handleIconClick = () => {
    setSidebarExpanded((prev) => !prev)
  }

  return (
    <div style={{ height: "calc(100vh - 50px)", overflow: "hidden", backgroundColor: "#f0f2f5" }}>
      <div
        style={{
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          height: "calc(100vh - 50px)",
        }}
        className="bg-white relative"
      >
        <div className="flex w-full h-full relative">
          {/* Chart Container */}
          <div
            className={`border-r border-gray-300 ${
              sidebarExpanded ? "w-[calc(100%-320px)]" : "w-[calc(100%-60px)]"
            } h-full`}
          >
            <CustomProChart symbol={selectedSymbol} interval="1m" height="100%" />
          </div>

          {/* Expandable Content Panel - always both blocks, Prediction on top */}
          <div
            className={`bg-white border-gray-300 overflow-hidden ${
              sidebarExpanded ? "w-[320px]" : "w-0"
            } h-full transition-all duration-300`}
          >
            {sidebarExpanded && (
              <div className="py-2 pl-2 h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Prediction & Sentiment News</h3>
                  <button
                    onClick={() => setSidebarExpanded(false)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="h-[calc(100%-50px)] overflow-y-auto flex flex-col gap-3">
                  <PredictionBlock />
                  <SentimentNews />
                </div>
              </div>
            )}
          </div>

          {/* Icon Sidebar */}
          <div className="w-[60px] flex flex-col items-center py-4 gap-4 h-full border-l border-gray-300">
            <button
              onClick={handleIconClick}
              className={`p-3 rounded-lg transition-colors ${
                sidebarExpanded ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              title="Prediction & Sentiment News"
            >
              <TrendingUp size={18} />
            </button>

            <button
              className="p-3 rounded-lg bg-white text-gray-600 hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>

            <button
              className="p-3 rounded-lg bg-white text-gray-600 hover:bg-gray-100 transition-colors"
              title="Analytics"
            >
              <BarChart3 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
