import React from "react";
import { NewsItem } from "../types";
import { ExternalLink, Sparkles, MessageSquare, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "motion/react";

interface NewsCardProps {
  key?: any;
  news: NewsItem;
  onSelectForAI: (item: NewsItem) => void;
  isAISelected: boolean;
}

export default function NewsCard({ news, onSelectForAI, isAISelected }: NewsCardProps) {
  // Brand color mapping
  const getSourceStyle = (source: NewsItem["source"]) => {
    switch (source) {
      case "כלכליסט":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          badge: "bg-rose-100 text-rose-800 border border-rose-200/80 hover:bg-rose-200/60",
          accentLine: "bg-rose-300",
        };
      case "גלובס":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200/60",
          badge: "bg-amber-100/90 text-amber-800 border border-amber-200/60 hover:bg-amber-200/60",
          accentLine: "bg-amber-300",
        };
      case "ביזפורטל":
        return {
          bg: "bg-sky-50 text-sky-800 border-sky-200",
          badge: "bg-sky-100 text-sky-800 border border-sky-200/80 hover:bg-sky-200/60",
          accentLine: "bg-sky-300",
        };
      case "ynet כלכלה":
        return {
          bg: "bg-orange-50 text-orange-800 border-orange-200",
          badge: "bg-orange-100/90 text-orange-800 border border-orange-200/80 hover:bg-orange-200/60",
          accentLine: "bg-orange-300",
        };
      case "TheMarker":
        return {
          bg: "bg-slate-100/70 text-slate-800 border-slate-200",
          badge: "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200/60",
          accentLine: "bg-slate-400",
        };
      default:
        return {
          bg: "bg-gray-50 text-gray-700 border-gray-200",
          badge: "bg-gray-100 text-gray-700 border border-gray-200",
          accentLine: "bg-gray-300",
        };
    }
  };

  const getSentimentStyle = (sentiment: NewsItem["sentiment"]) => {
    switch (sentiment) {
      case "חיובי":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          text: "סנטימנט חיובי",
        };
      case "שלילי":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: <TrendingDown className="w-3.5 h-3.5" />,
          text: "סנטימנט שלילי",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-600 border-slate-200",
          icon: <Minus className="w-3.5 h-3.5" />,
          text: "סנטימנט נייטרלי",
        };
    }
  };

  const sourceStyle = getSourceStyle(news.source);
  const sentimentStyle = getSentimentStyle(news.sentiment);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`relative bg-white rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isAISelected
          ? "ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/5 shadow-sm"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
      id={`news-card-${news.id}`}
    >
      {/* Outlet vertical accent line */}
      <div className={`absolute top-0 right-0 bottom-0 w-1 ${sourceStyle.accentLine}`} />

      <div className="p-5 pr-6 flex-1 flex flex-col">
        {/* Card Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full shadow-2xs ${sourceStyle.badge}`}
            >
              {news.source}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
              {news.category}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">{news.publishedTime}</span>
        </div>

        {/* Headline */}
        <h3 className="text-slate-900 font-bold text-[17px] leading-snug mb-2.5 hover:text-slate-800 transition-colors">
          {news.title}
        </h3>

        {/* Short Summary */}
        <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
          {news.summary}
        </p>

        {/* Sentiment Indicator and AI Focus Pill */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 mb-1.5">
          <span
            className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${sentimentStyle.bg}`}
          >
            {sentimentStyle.icon}
            {sentimentStyle.text}
          </span>
          {isAISelected && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500 text-white animate-pulse">
              <Sparkles className="w-3 h-3" />
              במיקוד ניתוח AI
            </span>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="bg-slate-50/60 border-t border-slate-100 px-5 py-3 pr-6 flex items-center justify-between gap-3 text-xs">
        {/* Read Full Article Button */}
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-950 font-medium transition-colors cursor-pointer py-1"
          id={`link-read-full-${news.id}`}
        >
          <span>לכתבה המלאה</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* AI Analysis trigger */}
        <button
          onClick={() => onSelectForAI(news)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
            isAISelected
              ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
              : "bg-white text-emerald-700 border border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-300"
          }`}
          id={`btn-ai-analyze-${news.id}`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAISelected ? "animate-pulse" : ""}`} />
          <span>{isAISelected ? "בחר כתבה אחרת" : "ניתוח פיננסי ב-AI"}</span>
        </button>
      </div>
    </motion.div>
  );
}
