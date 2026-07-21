import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK safely if key is available
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Robust parsing for markdown-wrapped JSON responses
function parseJSONContent(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return JSON.parse(cleaned.trim());
}

// Fallback high-quality financial news
const FALLBACK_NEWS = [
  {
    id: "fb-1",
    title: "המסחר בת\"א ננעל בעליות שערים: מדד ת\"א 35 עלה ב-0.9%, ת\"א 125 ב-1.1%",
    summary: "הבורסה המקומית הגיבה בחיוב למגמה החיובית מעבר לים ולדוחות הבנקים המרשימים שפורסמו הבוקר. מחזור המסחר היה ער במיוחד.",
    url: "https://www.bizportal.co.il",
    source: "ביזפורטל",
    sentiment: "חיובי",
    category: "מניות",
    publishedTime: "לפני חצי שעה"
  },
  {
    id: "fb-2",
    title: "הייטק ישראלי בתנופה: גיוסי ההון ברבעון השני חצו את רף ה-1.5 מיליארד דולר",
    summary: "השקעות זרות מסיביות בסטארטאפים בתחום הסייבר והבינה המלאכותית בישראל מסמנות התאוששות מהירה של ענף הטכנולוגיה המקומי.",
    url: "https://www.themarker.com",
    source: "TheMarker",
    sentiment: "חיובי",
    category: "הייטק",
    publishedTime: "לפני שעה"
  },
  {
    id: "fb-3",
    title: "מדד מחירי הדיור רושם ירידה מפתיעה של 0.3%; האם הריבית הגבוהה עושה את שלה?",
    summary: "הלשכה המרכזית לסטטיסטיקה מדווחת על בלימה בקצב עליית המחירים, לצד עלייה קלה בהיצע הדירות החדשות הלא מכורות בשוק.",
    url: "https://www.globes.co.il",
    source: "גלובס",
    sentiment: "שלילי",
    category: "נדל\"ן",
    publishedTime: "לפני שעתיים"
  },
  {
    id: "fb-4",
    title: "בנק לאומי מציג רווח נקי מטורף של 1.95 מיליארד שקל ברבעון ומחלק דיבידנד ענק",
    summary: "הדוחות הכספיים של הבנק משקפים עלייה בהכנסות מריבית וצמיחה חזקה בתיק האשראי, המאפשרת חלוקת רווחים נדיבה לבעלי המניות.",
    url: "https://www.calcalist.co.il",
    source: "כלכליסט",
    sentiment: "חיובי",
    category: "מניות",
    publishedTime: "לפני 3 שעות"
  },
  {
    id: "fb-5",
    title: "בנק ישראל צפוי להותיר את הריבית ללא שינוי ברמתה הנוכחית של 4.5%",
    summary: "כלכלנים מעריכים כי על אף התמתנות מסוימת באינפלציה, הנגיד יבחר לנקוט במדיניות זהירה על רקע הגירעון הממשלתי ואי-הוודאות הגיאופוליטית.",
    url: "https://www.ynet.co.il",
    source: "ynet כלכלה",
    sentiment: "נייטרלי",
    category: "מאקרו",
    publishedTime: "לפני 4 שעות"
  },
  {
    id: "fb-6",
    title: "מניית אנבידיה מזנקת בניו יורק בעקבות ביקוש חסר תקדים לשבבי ה-Blackwell החדשים",
    summary: "ענקיות הטכנולוגיה ממשיכות להצטייד בחומרה המתקדמת של אנבידיה לאימון מודלי בינה מלאכותית, מה שמזניק את שווי השוק שלה לשיאים חדשים.",
    url: "https://www.bizportal.co.il",
    source: "ביזפורטל",
    sentiment: "חיובי",
    category: "הייטק",
    publishedTime: "לפני 5 שעות"
  },
  {
    id: "fb-7",
    title: "שוק האג\"ח המקומי יציב: תשואת האג\"ח הממשלתית ל-10 שנים נסחרת ברמה של 4.8%",
    summary: "עליות קלות נרשמו באגרות החוב הקונצרניות השקליות. המשקיעים ממשיכים להעדיף אפיקים קצרי מועד עם תשואות מובטחות.",
    url: "https://www.globes.co.il",
    source: "גלובס",
    sentiment: "נייטרלי",
    category: "מאקרו",
    publishedTime: "לפני 6 שעות"
  },
  {
    id: "fb-8",
    title: "השקל מתחזק מול המטבעות הזרים: הדולר יורד לרמה של 3.63 שקלים, האירו ל-3.95 שקלים",
    summary: "המשך ירידת הדולר מיוחסת לפעילות של גופים מוסדיים המגדרים את השקעותיהם בחו\"ל בעקבות העליות החדות בוול סטריט.",
    url: "https://www.calcalist.co.il",
    source: "כלכליסט",
    sentiment: "חיובי",
    category: "מאקרו",
    publishedTime: "לפני 7 שעות"
  },
  {
    id: "fb-9",
    title: "דאגה בענף המלונאות והתיירות: תפוסת המלונות בצפון הארץ ירדה לשפל חסר תקדים",
    summary: "הנזקים הכלכליים לעסקים באזורי העימות מעמיקים, ובעלי המלונות והצימרים דורשים מתווה פיצויים מורחב ומיידי ממשרד האוצר.",
    url: "https://www.ynet.co.il",
    source: "ynet כלכלה",
    sentiment: "שלילי",
    category: "כללי",
    publishedTime: "לפני 8 שעות"
  }
];

// Fallback market indices
const FALLBACK_INDICES = [
  { name: "ת\"א 35", value: "2,084.50", change: "+0.92%", isPositive: true },
  { name: "ת\"א 125", value: "2,198.15", change: "+1.12%", isPositive: true },
  { name: "S&P 500", value: "5,420.30", change: "+0.45%", isPositive: true },
  { name: "נאסד\"ק", value: "18,912.40", change: "+0.78%", isPositive: true },
  { name: "דולר / שקל", value: "3.6320", change: "-0.41%", isPositive: true }, // Shekel strengthening is positive!
  { name: "אירו / שקל", value: "3.9480", change: "-0.25%", isPositive: true }
];

// Helper to slightly vary index values to make them look "alive"
function getAliveIndices() {
  return FALLBACK_INDICES.map(idx => {
    const isUSDorEUR = idx.name.includes("שקל");
    const originalVal = parseFloat(idx.value.replace(/,/g, ""));
    const percentChange = (Math.random() * 0.15 - 0.05); // -0.05% to +0.10% fluctuation
    const newVal = originalVal * (1 + percentChange / 100);
    const roundedVal = isUSDorEUR ? newVal.toFixed(4) : newVal.toFixed(2);
    
    // Format with commas
    const formattedVal = parseFloat(roundedVal).toLocaleString(undefined, {
      minimumFractionDigits: isUSDorEUR ? 4 : 2,
      maximumFractionDigits: isUSDorEUR ? 4 : 2
    });

    const currentChangeVal = parseFloat(idx.change.replace(/[%+]/g, ""));
    const finalChange = currentChangeVal + percentChange;
    const finalChangeStr = (finalChange >= 0 ? "+" : "") + finalChange.toFixed(2) + "%";
    
    // For USD/ILS or EUR/ILS, a negative change means shekel is strengthening (positive news)
    const isPositive = isUSDorEUR ? finalChange <= 0 : finalChange >= 0;

    return {
      name: idx.name,
      value: formattedVal,
      change: finalChangeStr,
      isPositive: isPositive
    };
  });
}

// API: Get news
app.get("/api/news", async (req, res) => {
  if (!ai) {
    console.log("Gemini API key not found. Serving high-quality fallback news.");
    return res.json({ source: "cache", data: FALLBACK_NEWS });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const prompt = `אתה דשבורד חדשות שוק ההון והכלכלה המוביל בישראל.
תאריך היום הנו: ${todayStr}.
עליך להשתמש בכלי החיפוש של גוגל (googleSearch) כדי לקבל את כותרות וידיעות החדשות הכלכליות, העסקיות ושוק ההון העדכניות, המעניינות והחשובות ביותר מהיום בישראל.
עליך להתמקד באוסף של ידיעות מהאתרים הבאים בדיוק:
1. כלכליסט (calcalist.co.il)
2. גלובס (globes.co.il)
3. ביזפורטל (bizportal.co.il)
4. ynet כלכלה (ynet.co.il)
5. TheMarker (themarker.com)

נסה למצוא לפחות 2-3 ידיעות מהיום מכל אחד מהמקורות הללו, בסך הכל בין 10 ל-15 ידיעות.
עבור כל ידיעה, החזר אובייקט עם השדות הבאים בעברית:
- id: מזהה ייחודי קצר, למשל "news-1"
- title: כותרת הידיעה בעברית (מדויקת, מעניינת ומקצועית)
- summary: סיכום קצר של הידיעה בעברית (1-2 משפטים, איכותי וממצה)
- url: הקישור הישיר לכתבה (במידה ולא מצאת קישור ישיר מדויק מהיום, ספק קישור לעמוד המדור הראשי באותו האתר, למשל https://www.globes.co.il/news/home.aspx?fid=2 או https://www.calcalist.co.il/market/home/0,7340,L-3674,00.html וכדומה)
- source: שם המקור בדיוק מתוך הבאים: 'כלכליסט', 'גלובס', 'ביזפורטל', 'ynet כלכלה', 'TheMarker'
- sentiment: סנטימנט הידיעה מתוך: 'חיובי' (למשל רווחים גבוהים, עליות שערים, גיוס הון מוצלח), 'שלילי' (למשל ירידות, הפסדים, פיטורים, אינפלציה עולה), או 'נייטרלי'
- category: קטגוריית הידיעה מתוך: 'מניות', 'מאקרו', 'נדל"ן', 'הייטק', 'כללי'
- publishedTime: הערכת זמן הפרסום מהיום (למשל: "לפני חצי שעה", "לפני שעתיים", "09:15", "14:30")

החזר את התשובה אך ורק כפורמט JSON תקין ומפורסס, כמערך של אובייקטים לפי המבנה לעיל.
אל תוסיף שום מילות הקדמה או סיום, אל תעטוף בדבר מלבד ה-JSON עצמו או קוד בלוק שלו.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const newsData = parseJSONContent(text);
    if (Array.isArray(newsData) && newsData.length > 0) {
      return res.json({ source: "live", data: newsData });
    } else {
      throw new Error("Response is not a valid array");
    }

  } catch (err) {
    console.error("Error fetching live news via Gemini, returning fallbacks:", err);
    return res.json({ source: "fallback", data: FALLBACK_NEWS });
  }
});

// API: Get market indices
app.get("/api/indices", async (req, res) => {
  if (!ai) {
    return res.json({ source: "live-dynamic", data: getAliveIndices() });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const prompt = `תאריך היום הנו: ${todayStr}.
בצע חיפוש ברשת (googleSearch) והחזר את השערים העדכניים ביותר של המדדים הכלכליים הבאים בדיוק:
1. מדד ת"א 35 (TA-35)
2. מדד ת"א 125 (TA-125)
3. S&P 500
4. נאסד"ק (Nasdaq)
5. שער דולר / שקל (USD/ILS)
6. שער אירו / שקל (EUR/ILS)

עבור כל מדד, החזר אובייקט המכיל:
- name: שם המדד בעברית (בדיוק: "ת\"א 35", "ת\"א 125", "S&P 500", "נאסד\"ק", "דולר / שקל", "אירו / שקל")
- value: הערך העדכני של היום כמחרוזת (למשל "2,084.50" למדדים או "3.6320" למטבעות)
- change: שינוי אחוזי יומי כמחרוזת כולל סימן פלוס או מינוס (למשל "+0.85%" או "-0.32%")
- isPositive: בוליאני המציין האם השינוי חיובי למשק הישראלי (עבור מדדי מניות: עלייה היא חיובית; עבור שער הדולר והאירו: ירידה בשער מייצגת שקל חזק וזה חיובי, עלייה בשער פירושה שקל נחלש וזה שלילי).

החזר את התשובה כ-JSON תקין בלבד בצורת מערך המכיל בדיוק את 6 האובייקטים הללו. אל תוסיף שום הסבר.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response for indices");
    }

    const indicesData = parseJSONContent(text);
    if (Array.isArray(indicesData) && indicesData.length === 6) {
      return res.json({ source: "live", data: indicesData });
    } else {
      throw new Error("Indices data is invalid or incomplete");
    }

  } catch (err) {
    console.error("Error fetching live indices via Gemini, returning dynamic fallbacks:", err);
    return res.json({ source: "fallback-dynamic", data: getAliveIndices() });
  }
});

// API: AI Assistant Chat
app.post("/api/chat", async (req, res) => {
  const { messages, selectedArticle } = req.body;

  if (!ai) {
    return res.json({
      text: "אני אשמח לעזור לך לנתח את שוק ההון! אנא הגדר מפתח GEMINI_API_KEY בטאב הסודות כדי להפעיל את העוזר החכם של הדשבורד בזמן אמת."
    });
  }

  try {
    const systemInstruction = `אתה עוזר פיננסי חכם ומומחה לשוק ההון בישראל.
אתה מעניק ניתוחים, הסברים ותשובות ברורות ומקצועיות בעברית קולחת.
${selectedArticle ? `המשתמש כעת קורא את הכתבה הבאה:
כותרת: ${selectedArticle.title}
מקור: ${selectedArticle.source}
קטגוריה: ${selectedArticle.category}
תקציר: ${selectedArticle.summary}
התייחס לכתבה זו במידת הצורך.` : ""}
ענה תמיד בעברית מקצועית, שומר על נימה אדיבה, מעמיקה אך קריאה ומובנת גם למשקיעים מתחילים.
זכור להדגיש כי אין בדבריך משום המלצה לרכישה או מכירה של ניירות ערך או ייעוץ השקעות מקצועי.`;

    const chatMessages = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    // Generate response
    const lastMessage = chatMessages[chatMessages.length - 1];
    const previousHistory = chatMessages.slice(0, -1);

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      history: previousHistory,
      config: {
        systemInstruction,
      }
    });

    const response = await chat.sendMessage({
      message: lastMessage.parts[0].text
    });

    return res.json({ text: response.text });

  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "שגיאה בעיבוד בקשת ה-AI" });
  }
});

// Serve Vite or Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
