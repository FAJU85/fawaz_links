export interface Env {
    ASSETS: { fetch: (request: Request) => Promise<Response> };
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
    HF_TOKEN?: string;
    HF_DATASET?: string;
    GEMINI_API_KEY?: string;
    [key: string]: any;
}

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-pin",
};

function jsonResponse(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
        },
    });
}

function escapeHtml(str: string): string {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toBase64Utf8(str: string): string {
    try {
        const bytes = new TextEncoder().encode(str);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch {
        return btoa(unescape(encodeURIComponent(str)));
    }
}

// In-memory request ledger during Worker lifecycle
const inMemoryRequests: any[] = [];

// Domain knowledge responses for Fawaz Al-Jubaili
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
        : "Welcome! Fawaz Al-Jubaili is a Technical Solutions & Systems Management Professional and ZATCA Certified Customs Specialist. Feel free to ask about his experience or certifications.";
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // Preflight CORS handler
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: CORS_HEADERS,
            });
        }

        // API Route: Contact Request Submission
        if (url.pathname === "/api/contact-request" && request.method === "POST") {
            try {
                const body = await request.json().catch(() => ({})) as Record<string, string>;
                const rawName = body.name || body.fullName || body.full_name;
                const rawEmail = body.email;
                const rawCompany = body.company || body.organization || "غير محدد";
                const rawPosition = body.position || body.title || body.service || "طلب تواصل";
                const rawMobile = body.mobile || body.phone;
                const rawNotes = body.notes || body.message || "";

                if (!rawName || !rawEmail) {
                    return jsonResponse({ error: "Missing required fields (name and email)" }, 400);
                }

                const cleanEmail = String(rawEmail).trim();
                if (!isValidEmail(cleanEmail)) {
                    return jsonResponse({ error: "Invalid email address" }, 400);
                }

                const cleanName = String(rawName).trim();
                const cleanCompany = String(rawCompany).trim();
                const cleanPosition = String(rawPosition).trim();
                const cleanMobile = rawMobile ? String(rawMobile).trim() : "N/A";
                const cleanNotes = rawNotes ? String(rawNotes).trim() : "";

                const requestId = Math.random().toString(36).substring(2, 9);
                const timestamp = new Date().toISOString();

                const dataRecord = {
                    requestId,
                    name: cleanName,
                    company: cleanCompany,
                    position: cleanPosition,
                    mobile: cleanMobile,
                    email: cleanEmail,
                    notes: cleanNotes,
                    timestamp,
                    status: "pending"
                };

                inMemoryRequests.unshift(dataRecord);
                if (inMemoryRequests.length > 100) inMemoryRequests.pop();

                const tgToken = env.TELEGRAM_BOT_TOKEN;
                const chatId = env.TELEGRAM_CHAT_ID;
                const hfToken = env.HF_TOKEN;
                const hfDataset = env.HF_DATASET;

                // Send Telegram Notification if configured
                if (tgToken && chatId) {
                    try {
                        let telegramHtml = `🔔 <b>طلب معلومات اتصال جديد</b>\n----------------------------\n<b>ID:</b> <code>${requestId}</code>\n👤 <b>الاسم:</b> ${escapeHtml(cleanName)}\n🏢 <b>الشركة:</b> ${escapeHtml(cleanCompany)}\n💼 <b>المنصب:</b> ${escapeHtml(cleanPosition)}\n📧 <b>الإيميل:</b> ${escapeHtml(cleanEmail)}\n📱 <b>الجوال:</b> ${escapeHtml(cleanMobile)}`;
                        if (cleanNotes) {
                            telegramHtml += `\n📝 <b>ملاحظات:</b> ${escapeHtml(cleanNotes)}`;
                        }
                        telegramHtml += `\n----------------------------\n✅ للموافقة: /approve_${requestId}\n❌ للرفض: /reject_${requestId}`;

                        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: telegramHtml,
                                parse_mode: "HTML"
                            })
                        });
                    } catch (tgErr) {
                        console.error("Cloudflare Worker Telegram error:", tgErr);
                    }
                }

                // Backup to Hugging Face dataset if configured
                if (hfToken && hfDataset) {
                    try {
                        const jsonString = JSON.stringify(dataRecord, null, 2);
                        const b64 = toBase64Utf8(jsonString);

                        await fetch(`https://huggingface.co/api/datasets/${hfDataset}/commit/main`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${hfToken}`
                            },
                            body: JSON.stringify({
                                actions: [{
                                    action: "create",
                                    path: `requests/req_${requestId}.json`,
                                    content: b64,
                                    encoding: "base64"
                                }],
                                message: `New contact request from ${cleanName}`
                            })
                        });
                    } catch (hfErr) {
                        console.error("Cloudflare Worker HF backup error:", hfErr);
                    }
                }

                return jsonResponse({
                    success: true,
                    message: "Request received successfully",
                    requestId
                });
            } catch (err: any) {
                console.error("Worker contact-request error:", err);
                return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
            }
        }

        // API Route: Contact Requests listing (Admin)
        if (url.pathname === "/api/contact-requests" && request.method === "GET") {
            const pin = request.headers.get("x-admin-pin");
            if (pin !== "2026") {
                return jsonResponse({ error: "Unauthorized" }, 401);
            }
            return jsonResponse({
                requests: inMemoryRequests,
                notice: "Live inquiries dispatched to Telegram / HF."
            });
        }

        // API Route: AI Chat
        if (url.pathname === "/api/ai-chat" && request.method === "POST") {
            try {
                const body = await request.json().catch(() => ({})) as { query?: string; context?: string; systemPrompt?: string };
                const { query, context: userCtx, systemPrompt } = body;

                if (!query || typeof query !== "string") {
                    return jsonResponse({ error: "Query is required" }, 400);
                }

                const isArabic = /[\u0600-\u06FF]/.test(query);
                const lang = isArabic ? "ar" : "en";
                const apiKey = env.GEMINI_API_KEY;

                if (apiKey) {
                    try {
                        const fullSystemInstruction = (systemPrompt || "You are the AI Assistant for Fawaz Al-Jubaili. Be professional, polite, and helpful.") + (userCtx ? `\n\nContext: ${userCtx}` : "");

                        const geminiRes = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    systemInstruction: { parts: [{ text: fullSystemInstruction }] },
                                    contents: [{ parts: [{ text: query }] }],
                                    generationConfig: { temperature: 0.7 }
                                })
                            }
                        );

                        if (geminiRes.ok) {
                            const data: any = await geminiRes.json();
                            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                return jsonResponse({ success: true, response: text });
                            }
                        }
                    } catch (err) {
                        console.warn("Worker Gemini API call fallback:", err);
                    }
                }

                const fallback = getDomainFallbackAnswer(query, lang);
                return jsonResponse({ success: true, response: fallback });
            } catch (e: any) {
                return jsonResponse({ error: "Internal AI processing error" }, 500);
            }
        }

        // API Route: Unsubscribe
        if (url.pathname === "/unsubscribe" && request.method === "GET") {
            const email = url.searchParams.get("email") || "you@example.com";
            return new Response(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Unsubscribed successfully for ${escapeHtml(email)}</h2><a href="/">Back to Profile</a></body></html>`, {
                headers: { "Content-Type": "text/html; charset=utf-8" }
            });
        }

        // Static assets fallback
        if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
            return env.ASSETS.fetch(request);
        }

        return new Response("Not Found", { status: 404 });
    }
};
