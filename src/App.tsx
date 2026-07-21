import React, { useState, useEffect } from "react";
import { NewsItem, MarketIndex, ChatMessage } from "./types";
import IndexTicker from "./components/IndexTicker";
import NewsCard from "./components/NewsCard";
import AIAssistant from "./components/AIAssistant";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ChevronLeft,
  X,
  PieChart,
  Grid,
  ListFilter
} from "lucide-react";

export default function App() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingIndices, setLoadingIndices] = useState(true);
  
  // Filtering and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const [selectedTickerFilter, setSelectedTickerFilter] = useState<string | null>(null);

  // AI Assistant state
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Meta stats
  const [newsSourceMeta, setNewsSourceMeta] = useState<"live" | "fallback" | "cache" | null>(null);

  // Fetch news data
  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data.data || []);
      setNewsSourceMeta(data.source);
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch market indices
  const fetchIndices = async () => {
    setLoadingIndices(true);
    try {
      const res = await fetch("/api/indices");
      const data = await res.json();
      setIndices(data.data || []);
    } catch (err) {
      console.error("Failed to fetch indices:", err);
    } finally {
      setLoadingIndices(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNews();
    fetchIndices();
  }, []);

  // Format dynamic Hebrew Date
  const getHebrewDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("he-IL", options);
  };

  // Chat agent communication
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setLoadingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          selectedArticle: selectedArticle,
        }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: "assistant",
        content: data.text || "סליחה, אירעה שגיאה בחיבור לאנליסט ה-AI. אנא נסה שוב.",
        timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content: "משהו השתבש בדרך. אנא ודא שמפתח ה-API תקין ושיש חיבור אינטרנט פעיל.",
        timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Selecting an article to trigger focus in the AI model chat
  const handleSelectArticleForAI = (item: NewsItem) => {
    if (selectedArticle?.id === item.id) {
      // Toggle off
      setSelectedArticle(null);
    } else {
      setSelectedArticle(item);
      // Auto pre-populate chat with welcoming analytic request
      const systemWelcome: ChatMessage = {
        id: `welcome-${item.id}`,
        role: "assistant",
        content: `שלום! בחרת לנתח את הכתבה: "${item.title}".\nתוכל להשתמש באחד הכפתורים המהירים למטה או לשאול אותי כל שאלה כמו: "איך זה משפיע על מניות הטכנולוגיה?" או "מה המשמעות של סנטימנט ${item.sentiment} של הידיעה הזו?"`,
        timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages([systemWelcome]);
    }
  };

  // Reset chat history
  const handleClearChatHistory = () => {
    setChatMessages([]);
  };

  // Lists of available filters
  const sources = ["כלכליסט", "גלובס", "ביזפורטל", "ynet כלכלה", "TheMarker"];
  const categories = ["מניות", "מאקרו", "נדל\"ן", "הייטק", "כללי"];
  const sentiments = ["חיובי", "נייטרלי", "שלילי"];

  // Filter the news items
  const filteredNews = news.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = !selectedSource || item.source === selectedSource;
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSentiment = !selectedSentiment || item.sentiment === selectedSentiment;
    
    // Ticker specific filter: if selected, filter by category or title content matching name
    const matchesTicker =
      !selectedTickerFilter ||
      (selectedTickerFilter === "נדל\"ן" && item.category === "נדל\"ן") ||
      (selectedTickerFilter === "נאסד\"ק" && item.category === "הייטק") ||
      item.title.toLowerCase().includes(selectedTickerFilter.toLowerCase()) ||
      item.summary.toLowerCase().includes(selectedTickerFilter.toLowerCase()) ||
      // Default to general if no strict keyword match, just match category
      (selectedTickerFilter.includes("ת\"א") && item.category === "מניות");

    return matchesSearch && matchesSource && matchesCategory && matchesSentiment && matchesTicker;
  });

  // Calculate sentiment metrics for visual bento widgets
  const positiveCount = news.filter((n) => n.sentiment === "חיובי").length;
  const negativeCount = news.filter((n) => n.sentiment === "שלילי").length;
  const neutralCount = news.filter((n) => n.sentiment === "נייטרלי").length;
  const totalCount = news.length;

  const getSentimentBarPercentage = (count: number) => {
    if (totalCount === 0) return 0;
    return Math.round((count / totalCount) * 100);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col antialiased">
      {/* Real-time Ticker Header Component */}
      <IndexTicker
        indices={indices}
        loading={loadingIndices}
        onRefresh={fetchIndices}
        selectedTicker={selectedTickerFilter}
        onSelectTicker={(name) => setSelectedTickerFilter(name)}
      />

      {/* Primary Container */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 flex flex-col gap-6">
        
        {/* Main Dashboard Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                דשבורד פיננסי אישי
              </h1>
              {newsSourceMeta === "live" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  עדכונים חיים מהיום
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-medium">
              סקירת שוק וריכוז כותרות כלכליות מובילות בישראל בזמן אמת.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Calendar Widget */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-600 text-xs font-semibold">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{getHebrewDate()}</span>
            </div>

            {/* General Refresh News Trigger */}
            <button
              onClick={fetchNews}
              disabled={loadingNews}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition duration-150 cursor-pointer disabled:opacity-50"
              id="btn-refresh-all-news"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? "animate-spin text-emerald-400" : ""}`} />
              <span>{loadingNews ? "סורק אתרים..." : "רענן וסרוק חדשות"}</span>
            </button>
          </div>
        </div>

        {/* Bento Grid Analytics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Articles Stat */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">כתבות שנסרקו היום</span>
              <span className="text-2xl font-black text-slate-800 font-mono">
                {loadingNews ? "..." : totalCount}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Layers className="w-5 h-5 text-slate-500" />
            </div>
          </div>

          {/* Positive Sentiment Stat */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">ידיעות חיוביות</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {loadingNews ? "..." : positiveCount}
              </span>
            </div>
            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          {/* Negative Sentiment Stat */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block">ידיעות שליליות</span>
              <span className="text-2xl font-black text-rose-600 font-mono">
                {loadingNews ? "..." : negativeCount}
              </span>
            </div>
            <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
          </div>

          {/* Sentiment Share Indicator */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-center gap-1.5 shadow-2xs">
            <span className="text-xs text-slate-400 font-bold">יחס סנטימנט השוק היום</span>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${getSentimentBarPercentage(positiveCount)}%` }}
                className="h-full bg-emerald-500"
                title={`חיובי: ${getSentimentBarPercentage(positiveCount)}%`}
              />
              <div
                style={{ width: `${getSentimentBarPercentage(neutralCount)}%` }}
                className="h-full bg-slate-400"
                title={`נייטרלי: ${getSentimentBarPercentage(neutralCount)}%`}
              />
              <div
                style={{ width: `${getSentimentBarPercentage(negativeCount)}%` }}
                className="h-full bg-rose-500"
                title={`שלילי: ${getSentimentBarPercentage(negativeCount)}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold">
              <span className="text-emerald-600">חיובי ({getSentimentBarPercentage(positiveCount)}%)</span>
              <span className="text-slate-500">נייטרלי ({getSentimentBarPercentage(neutralCount)}%)</span>
              <span className="text-rose-600">שלילי ({getSentimentBarPercentage(negativeCount)}%)</span>
            </div>
          </div>
        </div>

        {/* Filters and Main layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: News Filters & News feed */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Search and Advanced Filter Panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש מילות מפתח בכותרות או בתמציות של הכתבות..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition duration-150"
                  id="news-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    id="btn-clear-search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters categories block */}
              <div className="space-y-3 pt-1">
                {/* Categories */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5" />
                    קטגוריה:
                  </span>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
                      selectedCategory === null
                        ? "bg-slate-800 border-slate-800 text-white"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                    id="filter-cat-all"
                  >
                    הכל
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                      id={`filter-cat-${cat}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sources Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5">
                    <ListFilter className="w-3.5 h-3.5" />
                    אתר מקור:
                  </span>
                  <button
                    onClick={() => setSelectedSource(null)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
                      selectedSource === null
                        ? "bg-slate-800 border-slate-800 text-white"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                    id="filter-source-all"
                  >
                    כל האתרים
                  </button>
                  {sources.map((src) => (
                    <button
                      key={src}
                      onClick={() => setSelectedSource(src)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
                        selectedSource === src
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                      id={`filter-source-${src.replace(/\s+/g, "-")}`}
                    >
                      {src}
                    </button>
                  ))}
                </div>

                {/* Sentiments */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5" />
                    סנטימנט:
                  </span>
                  <button
                    onClick={() => setSelectedSentiment(null)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
                      selectedSentiment === null
                        ? "bg-slate-800 border-slate-800 text-white"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                    id="filter-sentiment-all"
                  >
                    הכל
                  </button>
                  {sentiments.map((sent) => (
                    <button
                      key={sent}
                      onClick={() => setSelectedSentiment(sent)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
                        selectedSentiment === sent
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                      id={`filter-sentiment-${sent}`}
                    >
                      {sent}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticker active filter status alert */}
              {selectedTickerFilter && (
                <div className="bg-amber-500/5 border border-amber-500/15 p-2.5 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <Info className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>מוצגות כעת רק כתבות הקשורות לסיגנל: "{selectedTickerFilter}"</span>
                  </div>
                  <button
                    onClick={() => setSelectedTickerFilter(null)}
                    className="text-amber-600 hover:text-amber-800 text-xs font-bold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/15 px-2 py-1 rounded-md transition duration-150 cursor-pointer"
                    id="btn-clear-ticker-filter"
                  >
                    <span>הצג הכל</span>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* News Feed Cards Block */}
            {loadingNews ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 rounded-sm w-24"></div>
                      <div className="h-4 bg-slate-200 rounded-sm w-16"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded-sm w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded-sm w-full"></div>
                      <div className="h-4 bg-slate-200 rounded-sm w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                <Info className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-lg">לא נמצאו כתבות מתאימות</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  נסה לשנות את מסנני החיפוש, לבחור קטגוריה אחרת, או לבטל את פילטר המדד הפעיל כדי לקבל תוצאות רחבות יותר.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSource(null);
                    setSelectedCategory(null);
                    setSelectedSentiment(null);
                    setSelectedTickerFilter(null);
                  }}
                  className="mt-3 inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition duration-150 cursor-pointer"
                  id="btn-clear-all-filters"
                >
                  אפס את כל המסננים
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNews.map((item) => (
                  <NewsCard
                    key={item.id}
                    news={item}
                    onSelectForAI={handleSelectArticleForAI}
                    isAISelected={selectedArticle?.id === item.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: AI Investment Analyst Panel */}
          <div className="lg:col-span-1">
            <AIAssistant
              selectedArticle={selectedArticle}
              onClearSelection={() => setSelectedArticle(null)}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearChatHistory}
              loading={loadingChat}
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-right">
            <p className="font-bold text-slate-200 text-sm">דשבורד חדשות שוק ההון</p>
            <p className="text-slate-500">
              כל זכויות הדיווחים הכלכליים שמורות למקורותיהן בהתאמה: כלכליסט, גלובס, ביזפורטל, ynet כלכלה, ו-TheMarker.
            </p>
          </div>
          <p className="text-slate-500 font-mono text-[10px] text-center md:text-left">
            מערכת ניתוח מבוססת Gemini-3.5-Flash עם חיפוש של גוגל בזמן אמת.
          </p>
        </div>
      </footer>
    </div>
  );
}
