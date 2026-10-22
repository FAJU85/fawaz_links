interface Env {
    GEMINI_API_KEY?: string;
    [key: string]: any;
}

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

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
    try {
        const body = await context.request.json().catch(() => ({})) as { query?: string; context?: string; systemPrompt?: string };
        const { query, context: userCtx, systemPrompt } = body;

        if (!query || typeof query !== "string") {
            return new Response(JSON.stringify({ error: "Query is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const isArabic = /[\u0600-\u06FF]/.test(query);
        const lang = isArabic ? "ar" : "en";
        const apiKey = context.env.GEMINI_API_KEY;

        if (apiKey) {
            try {
                const fullSystemInstruction = (systemPrompt || "You are the AI Assistant for Fawaz Al-Jubaili (فواز عبد الكريم الجبيلي). Be professional, polite, and helpful.") + (userCtx ? `\n\nContext: ${userCtx}` : "");

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            systemInstruction: {
                                parts: [{ text: fullSystemInstruction }]
                            },
                            contents: [
                                {
                                    parts: [{ text: query }]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.7
                            }
                        })
                    }
                );

                if (geminiRes.ok) {
                    const data: any = await geminiRes.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        return new Response(JSON.stringify({ success: true, response: text }), {
                            headers: { "Content-Type": "application/json" }
                        });
                    }
                }
            } catch (err) {
                console.warn("Cloudflare Pages Gemini Edge call fallback:", err);
            }
        }

        const fallback = getDomainFallbackAnswer(query, lang);
        return new Response(JSON.stringify({ success: true, response: fallback }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: "Internal AI processing error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
