import React, { useState, useRef, useEffect } from "react";
import { NewsItem, ChatMessage } from "../types";
import { Sparkles, Send, Bot, User, Trash2, HelpCircle, X, ShieldAlert } from "lucide-react";

interface AIAssistantProps {
  selectedArticle: NewsItem | null;
  onClearSelection: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  loading: boolean;
}

export default function AIAssistant({
  selectedArticle,
  onClearSelection,
  messages,
  onSendMessage,
  onClearHistory,
  loading,
}: AIAssistantProps) {
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  // Preset prompts
  const getPresetPrompts = () => {
    if (selectedArticle) {
      return [
        {
          label: "הסבר את משמעות הכתבה במונחים פשוטים",
          prompt: `הסבר לי בבקשה בצורה פשוטה וברורה מה המשמעות של הכתבה הזו: "${selectedArticle.title}". מהם העיקרים שצריך להבין ממנה?`,
        },
        {
          label: "מהן ההשלכות האפשריות על המשקיעים?",
          prompt: `עבור הכתבה הזו: "${selectedArticle.title}", מהן ההשלכות הפיננסיות או האסטרטגיות האפשריות על מי שמשקיע במניות או בנכסים קשורים בישראל?`,
        },
        {
          label: "האם מדובר בסנטימנט חיובי או שלילי לטווח הארוך?",
          prompt: `לגבי הידיעה הזו: "${selectedArticle.title}" מאתר ${selectedArticle.source}, האם להערכתך מדובר בסיגנל חיובי או שלילי לשוק ההון בטווח הארוך, ומדוע?`,
        },
      ];
    } else {
      return [
        {
          label: "איך עליות הריבית משפיעות על מדדי המניות?",
          prompt: "איך שינויי הריבית של בנק ישראל משפיעים באופן כללי על הבורסה בתל אביב ועל שוק הנדל\"ן?",
        },
        {
          label: "מה זה מדד ת\"א 35 ואיך הוא מחושב?",
          prompt: "הסבר לי בקצרה מהו מדד ת\"א 35, אילו חברות הוא מייצג, ומה החשיבות שלו לשוק המקומי.",
        },
        {
          label: "מה ההבדל בין השקעה במניות לאג\"ח?",
          prompt: "תוכל להסביר בצורה פשוטה מה ההבדל בין השקעה במניות לבין השקעה באגרות חוב (אג\"ח) ממשלתיות או קונצרניות?",
        },
      ];
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md flex flex-col h-[650px] overflow-hidden" id="ai-assistant-panel">
      {/* Header */}
      <div className="bg-[#f5f2eb] text-slate-800 p-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600/10 p-1.5 rounded-lg border border-emerald-500/15">
            <Sparkles className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] leading-tight text-slate-800">אנליסט שוק ההון ב-AI</h3>
            <p className="text-[11px] text-slate-500">עוזר פיננסי אישי המבוסס על Gemini</p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-md hover:bg-slate-200/50"
            title="נקה היסטוריה"
            id="btn-clear-chat-history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected Article Context Callout */}
      {selectedArticle ? (
        <div className="bg-emerald-500/5 border-b border-emerald-500/15 p-3 flex items-start justify-between gap-3 animate-pulse-soft">
          <div className="flex-1 text-xs">
            <span className="font-bold text-emerald-800 block mb-0.5">ניתוח ממוקד על הכתבה:</span>
            <span className="text-slate-700 font-semibold line-clamp-2">{selectedArticle.title}</span>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">מקור: {selectedArticle.source}</span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/50 transition-colors"
            title="נקה מיקוד"
            id="btn-clear-article-focus"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 p-3 border-b border-slate-100 text-xs text-slate-500 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>לחץ על <strong>"ניתוח פיננסי ב-AI"</strong> בכל כתבה כדי לנתח אותה ספציפית.</span>
        </div>
      )}

      {/* Message History area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Bot className="w-12 h-12 text-slate-300 mb-3 stroke-[1.5]" />
            <h4 className="font-bold text-slate-700 mb-1 text-[15px]">שלום! במה אוכל לעזור היום?</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              שאל אותי שאלות על שוק ההון, הסברים כלכליים, או בחר כתבה מהדשבורד ונוכל לנתח אותה יחד לעומק.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === "user" ? "mr-auto flex-row-reverse" : "ml-auto"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-slate-200 text-slate-700"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white rounded-tr-none shadow-xs"
                    : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-xs"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                <span className="text-[10px] text-slate-400 block mt-1 text-left font-mono">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 max-w-[85%] ml-auto">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-200"></span>
              <span className="text-xs text-slate-500 mr-1.5">האנליסט מנתח כעת...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Preset Action Chips */}
      <div className="p-3 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex gap-2 shrink-0">
        <div className="flex gap-2 min-w-max">
          {getPresetPrompts().map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(p.prompt)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200/70 hover:border-emerald-200 transition-all duration-150 cursor-pointer disabled:opacity-50"
              id={`preset-prompt-${idx}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={selectedArticle ? "שאל משהו על הכתבה..." : "כתוב הודעה פיננסית..."}
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 disabled:opacity-75"
          id="chat-input-text"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white p-2.5 rounded-xl transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center cursor-pointer"
          id="btn-send-message"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </form>

      {/* Disclaimer */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5 shrink-0">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>השימוש באחריות המשתמש בלבד. המידע אינו מהווה תחליף לייעוץ השקעות מקצועי.</span>
      </div>
    </div>
  );
}
