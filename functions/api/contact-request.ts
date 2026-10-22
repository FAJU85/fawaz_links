interface Env {
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
    HF_TOKEN?: string;
    HF_DATASET?: string;
    [key: string]: any;
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

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
    try {
        const body = await context.request.json().catch(() => ({})) as Record<string, string>;
        const { name, company, position, mobile, email } = body;

        if (!name || !email || !company || !position) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const cleanEmail = String(email).trim();
        if (!isValidEmail(cleanEmail)) {
            return new Response(JSON.stringify({ error: "Invalid email address" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const cleanName = String(name).trim();
        const cleanCompany = String(company).trim();
        const cleanPosition = String(position).trim();
        const cleanMobile = mobile ? String(mobile).trim() : "N/A";

        const requestId = Math.random().toString(36).substring(2, 9);
        const timestamp = new Date().toISOString();

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

        const tgToken = context.env.TELEGRAM_BOT_TOKEN;
        const chatId = context.env.TELEGRAM_CHAT_ID;
        const hfToken = context.env.HF_TOKEN;
        const hfDataset = context.env.HF_DATASET;

        // 1. Send Telegram Notification if configured
        if (tgToken && chatId) {
            try {
                const telegramHtml = `🔔 <b>طلب معلومات اتصال جديد</b>\n----------------------------\n<b>ID:</b> <code>${requestId}</code>\n👤 <b>الاسم:</b> ${escapeHtml(cleanName)}\n🏢 <b>الشركة:</b> ${escapeHtml(cleanCompany)}\n💼 <b>المنصب:</b> ${escapeHtml(cleanPosition)}\n📧 <b>الإيميل:</b> ${escapeHtml(cleanEmail)}\n📱 <b>الجوال:</b> ${escapeHtml(cleanMobile)}\n----------------------------\n✅ للموافقة: /approve_${requestId}\n❌ للرفض: /reject_${requestId}`;

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
                console.error("Cloudflare Pages Telegram error:", tgErr);
            }
        }

        // 2. Backup to Hugging Face dataset if configured
        if (hfToken && hfDataset) {
            try {
                const jsonString = JSON.stringify(dataRecord, null, 2);
                const b64 = btoa(unescape(encodeURIComponent(jsonString)));

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
                console.error("Cloudflare Pages HF backup error:", hfErr);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: "Request received successfully",
            requestId
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
