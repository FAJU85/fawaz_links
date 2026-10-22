import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import validator from "validator";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure assets directory exists
const assetsDir = path.join(process.cwd(), "assets");
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Contact requests storage file
const requestsFilePath = path.join(assetsDir, "contact_requests.json");
if (!fs.existsSync(requestsFilePath)) {
    fs.writeFileSync(requestsFilePath, JSON.stringify([]), "utf-8");
}

function saveContactRequestLocally(record: Record<string, any>) {
    try {
        let list: any[] = [];
        if (fs.existsSync(requestsFilePath)) {
            const raw = fs.readFileSync(requestsFilePath, "utf-8");
            list = JSON.parse(raw || "[]");
        }
        list.unshift(record);
        // Keep last 100 requests
        if (list.length > 100) list = list.slice(0, 100);
        fs.writeFileSync(requestsFilePath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
        console.error("Failed to save contact request locally:", err);
    }
}

function getStoredContactRequests(): any[] {
    try {
        if (fs.existsSync(requestsFilePath)) {
            const raw = fs.readFileSync(requestsFilePath, "utf-8");
            return JSON.parse(raw || "[]");
        }
    } catch (err) {
        console.error("Failed to read contact requests:", err);
    }
    return [];
}

// Configure Multer for PDF storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "assets/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
        cb(null, `cv_${Date.now()}${ext}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    }
});

app.use(express.json());

// Serve assets directory statically
app.use("/assets", express.static(assetsDir));
// Serve public directory
app.use(express.static(path.join(process.cwd(), "public")));

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
    try {
        aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    } catch (e) {
        console.warn("Gemini client initialization warning:", e);
    }
}

// Intelligent fallback generator for Fawaz Al-Jubaili
function getDomainFallbackAnswer(query: string, langHint: "ar" | "en"): string {
    const q = query.toLowerCase();
    const isAr = langHint === "ar" || /[\u0600-\u06FF]/.test(query);

    if (q.includes("zatca") || q.includes("زكاة") || q.includes("جمارك") || q.includes("تخليص") || q.includes("customs")) {
        return isAr 
            ? "فواز الجبيلي حاصل على ترخيص معتمد في التخليص الجمركي من هيئة الزكاة والضريبة والجمارك (ZATCA - صدر في أغسطس 2025)، ولديه دراية تامة بالامتثال التجاري وإجراءات الاستيراد والتصدير وإدارة سلاسل الإمداد."
            : "Fawaz Al-Jubaili holds a ZATCA Certified Customs Clearance License (issued Aug 2025), with deep expertise in trade compliance, customs regulations, and supply chain logistics.";
    }

    if (q.includes("oracle") || q.includes("أوراكل") || q.includes("erp") || q.includes("pos") || q.includes("تقني") || q.includes("system")) {
        return isAr
            ? "يمتلك فواز خبرة عملية واسعة في أنظمة Oracle ERP وPOS، وتحليل البيانات المتقدم باستخدام Microsoft Excel، بالإضافة إلى خلفيته في الدعم الفني وتطوير الويب (Udacity Nanodegree)."
            : "Fawaz has practical expertise in Oracle ERP and POS systems, advanced data analysis in Microsoft Excel, and technical support systems combined with web development foundations.";
    }

    if (q.includes("خبرة") || q.includes("experience") || q.includes("وظيفة") || q.includes("عمل") || q.includes("job") || q.includes("role")) {
        return isAr
            ? "يشغل فواز حالياً منصب مدير مكتب الاستقبال في شركة المندارية للمقاولات (منذ 05/2022). وعمل سابقاً كمحاسب فرع في مجموعة السدحان (2021-2022) ومسؤول مبيعات ودعم في مكتبة جرير (2019-2020)."
            : "Fawaz currently serves as Front Desk Manager at Al-Mandaryah Contracting (since May 2022). Previously, he was a Branch Accountant at Al Sadhan Group (2021-2022) and Front End Associate at Jarir Bookstore (2019-2020).";
    }

    if (q.includes("تواصل") || q.includes("contact") || q.includes("email") || q.includes("لقاء") || q.includes("مقابلة") || q.includes("meet")) {
        return isAr
            ? "يسعد فواز بالتواصل معك! يمكنك إرسال طلب تواصل مباشر من خلال النموذج الموجود في الصفحة، أو حجز اجتماع مباشر عبر Calendly، أو زيارة حسابه على LinkedIn."
            : "Fawaz welcomes your connection! You can send a direct inquiry via the form on this page, book a meeting via Calendly, or connect on LinkedIn.";
    }

    return isAr
        ? "أهلاً بك! فواز عبد الكريم الجبيلي متخصص في الحلول التقنية وإدارة الأنظمة والتخليص الجمركي المعتمد (ZATCA). يسعدني الإجابة على أي استفسار حول خبراته أو مؤهلاته المهنية."
        : "Welcome! Fawaz Al-Jubaili is a Technical Solutions & Systems Management Professional and ZATCA Certified Customs Specialist. Feel free to ask about his experience, certifications, or schedule a meeting.";
}

// API: AI Chat Proxy
app.post("/api/ai-chat", async (req: Request, res: Response) => {
    try {
        const { query, context, systemPrompt } = req.body;
        if (!query || typeof query !== "string") {
            return res.status(400).json({ error: "Query is required" });
        }

        const isArabic = /[\u0600-\u06FF]/.test(query);
        const lang = isArabic ? "ar" : "en";

        // Try Gemini API if configured
        if (process.env.GEMINI_API_KEY) {
            try {
                if (!aiClient) {
                    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                }
                const fullSystemInstruction = (systemPrompt || "You are the AI Assistant for Fawaz Al-Jubaili (فواز عبد الكريم الجبيلي). Be professional, polite, and helpful.") + (context ? `\n\nContext: ${context}` : "");

                const result = await aiClient.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: query,
                    config: {
                        systemInstruction: fullSystemInstruction,
                        temperature: 0.7,
                    },
                });

                if (result.text) {
                    return res.json({ success: true, response: result.text });
                }
            } catch (geminiError: any) {
                console.warn("Gemini API call failed, using intelligent domain fallback:", geminiError?.message || geminiError);
            }
        }

        // Return intelligent domain response
        const fallbackText = getDomainFallbackAnswer(query, lang);
        return res.json({ success: true, response: fallbackText });
    } catch (error: any) {
        console.error("AI Route Error:", error.message || error);
        return res.status(500).json({ error: "Internal AI processing error" });
    }
});

// API: Handle CV Upload
app.post("/api/upload-cv", (req: Request, res: Response, next: NextFunction) => {
    upload.single("cv")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message || "Invalid file format" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const publicUrl = `/assets/${req.file.filename}`;
        return res.json({ success: true, url: publicUrl });
    });
});

// Helper for escaping HTML entities for Telegram
function escapeHtml(str: string): string {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// API: Handle Contact Request
app.post("/api/contact-request", async (req: Request, res: Response) => {
    const { name, company, position, mobile, email } = req.body;

    if (!name || !email || !company || !position) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (!validator.isEmail(String(email).trim())) {
        return res.status(400).json({ error: "Invalid email address" });
    }

    const cleanName = String(name).trim();
    const cleanCompany = String(company).trim();
    const cleanPosition = String(position).trim();
    const cleanEmail = String(email).trim();
    const cleanMobile = mobile ? String(mobile).trim() : "N/A";

    const hfToken = process.env.HF_TOKEN;
    const hfDataset = process.env.HF_DATASET;
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    try {
        const timestamp = new Date().toISOString();
        const requestId = Math.random().toString(36).substring(2, 9);
        const dataRecord = { 
            requestId, 
            name: cleanName, 
            company: cleanCompany, 
            position: cleanPosition, 
            mobile: cleanMobile, 
            email: cleanEmail, 
            timestamp, 
            status: "pending" 
        };

        // 1. Always save locally first so recruiter requests are never lost
        saveContactRequestLocally(dataRecord);

        // 2. Hugging Face dataset backup if configured
        if (hfToken && hfDataset) {
            try {
                const content = Buffer.from(JSON.stringify(dataRecord, null, 2)).toString("base64");
                await axios.post(`https://huggingface.co/api/datasets/${hfDataset}/commit/main`, {
                    actions: [{ action: "create", path: `requests/req_${requestId}.json`, content: content, encoding: "base64" }],
                    message: `New contact request from ${cleanName}`
                }, { 
                    headers: { Authorization: `Bearer ${hfToken}` },
                    timeout: 5000
                });
            } catch (hfErr: any) {
                console.error("HF API Error:", hfErr.response?.data || hfErr.message);
            }
        }

        // 3. Telegram Notification with robust HTML parsing (avoid Markdown underscore bugs)
        const telegramHtml = `🔔 <b>طلب معلومات اتصال جديد</b>\n----------------------------\n<b>ID:</b> <code>${requestId}</code>\n👤 <b>الاسم:</b> ${escapeHtml(cleanName)}\n🏢 <b>الشركة:</b> ${escapeHtml(cleanCompany)}\n💼 <b>المنصب:</b> ${escapeHtml(cleanPosition)}\n📧 <b>الإيميل:</b> ${escapeHtml(cleanEmail)}\n📱 <b>الجوال:</b> ${escapeHtml(cleanMobile)}\n----------------------------\n✅ للموافقة: /approve_${requestId}\n❌ للرفض: /reject_${requestId}`;

        if (tgToken && chatId) {
            await axios.post(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                chat_id: chatId,
                text: telegramHtml,
                parse_mode: "HTML"
            }, { timeout: 5000 }).catch(err => {
                console.error("Telegram API Error:", err.response?.data || err.message);
            });
        }

        return res.json({ success: true, message: "Request received successfully", requestId });
    } catch (error: any) {
        console.error("Backend Processing Error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// API: Get stored contact requests for Admin Console
app.get("/api/contact-requests", (req: Request, res: Response) => {
    const pin = req.headers["x-admin-pin"];
    // Read pin from file or default
    if (pin !== "2026") {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const requests = getStoredContactRequests();
    return res.json({ requests });
});

// Unsubscribe Route
app.get("/unsubscribe", (req: Request, res: Response) => {
    const email = req.query.email ? String(req.query.email) : "you@example.com";
    const templatePath = path.join(process.cwd(), "public", "unsubscribe_form.html");
    if (fs.existsSync(templatePath)) {
        let html = fs.readFileSync(templatePath, "utf-8");
        html = html.replace(/\{\{EMAIL\}\}/g, escapeHtml(email));
        html = html.replace(/\{\{SITE_URL\}\}/g, "/");
        return res.send(html);
    }
    return res.send(`<h2>Unsubscribed successfully for ${escapeHtml(email)}</h2>`);
});

async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req: Request, res: Response) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
