import React from "react";
import { MarketIndex } from "../types";
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Euro, Percent } from "lucide-react";

interface IndexTickerProps {
  indices: MarketIndex[];
  loading: boolean;
  onRefresh: () => void;
  selectedTicker: string | null;
  onSelectTicker: (name: string | null) => void;
}

export default function IndexTicker({
  indices,
  loading,
  onRefresh,
  selectedTicker,
  onSelectTicker,
}: IndexTickerProps) {
  return (
    <div className="bg-[#f5f2eb]/90 backdrop-blur-md text-slate-800 border-b border-slate-200/80 shadow-xs sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
        {/* Market Status and Dynamic Ticker Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start border-b border-slate-200/50 pb-2 md:pb-0 md:border-b-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse-soft"></span>
            <span className="font-semibold text-slate-700 text-[13px]">מדדי שוק בזמן אמת</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 transition duration-150 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="עדכן מדדים"
            id="btn-refresh-indices"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            <span>{loading ? "מעדכן..." : "רענן מדדים"}</span>
          </button>
        </div>

        {/* The Indices List */}
        <div className="w-full md:w-auto overflow-x-auto no-scrollbar flex items-center gap-3 py-1 px-1 -mx-4 md:mx-0">
          <div className="flex items-center gap-3 min-w-max px-4 md:px-0">
            {indices.map((idx) => {
              const isSelected = selectedTicker === idx.name;
              return (
                <button
                  key={idx.name}
                  onClick={() => onSelectTicker(isSelected ? null : idx.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600/10 border-emerald-500 text-emerald-800 shadow-xs"
                      : "bg-white/80 border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-white"
                  }`}
                  id={`ticker-${idx.name.replace(/\s+/g, "-")}`}
                >
                  <span className="font-bold text-slate-800">{idx.name}</span>
                  <span className="font-mono tracking-tight font-semibold text-slate-700">
                    {idx.value}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 font-mono font-bold ${
                      idx.isPositive ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {idx.isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    {idx.change}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
