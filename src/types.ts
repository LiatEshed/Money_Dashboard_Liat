export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: 'כלכליסט' | 'גלובס' | 'ביזפורטל' | 'ynet כלכלה' | 'TheMarker';
  sentiment: 'חיובי' | 'שלילי' | 'נייטרלי';
  category: 'מניות' | 'מאקרו' | 'נדל"ן' | 'הייטק' | 'כללי';
  publishedTime: string;
}

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
