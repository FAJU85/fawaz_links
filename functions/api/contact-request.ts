interface Env {
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
    HF_TOKEN?: string;
    HF_DATASET?: string;
    [key: string]: any;
}

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

export async function onRequestOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
    try {
        const body = await context.request.json().catch(() => ({})) as Record<string, string>;
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

        const tgToken = context.env.TELEGRAM_BOT_TOKEN;
        const chatId = context.env.TELEGRAM_CHAT_ID;
        const hfToken = context.env.HF_TOKEN;
        const hfDataset = context.env.HF_DATASET;

        let tgSent = false;
        let tgDetails = "";

        // 1. Send Telegram Notification immediately with plaintext fallback
        if (tgToken && chatId) {
            try {
                let telegramHtml = `🔔 <b>طلب معلومات اتصال جديد</b>\n----------------------------\n<b>ID:</b> <code>${requestId}</code>\n👤 <b>الاسم:</b> ${escapeHtml(cleanName)}\n🏢 <b>الشركة:</b> ${escapeHtml(cleanCompany)}\n💼 <b>المنصب:</b> ${escapeHtml(cleanPosition)}\n📧 <b>الإيميل:</b> ${escapeHtml(cleanEmail)}\n📱 <b>الجوال:</b> ${escapeHtml(cleanMobile)}`;
                if (cleanNotes) {
                    telegramHtml += `\n📝 <b>ملاحظات:</b> ${escapeHtml(cleanNotes)}`;
                }
                telegramHtml += `\n----------------------------\n✅ للموافقة: /approve_${requestId}\n❌ للرفض: /reject_${requestId}`;

                const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: telegramHtml,
                        parse_mode: "HTML"
                    })
                });

                const tgData = await tgRes.json().catch(() => ({})) as any;
                if (tgRes.ok && tgData.ok) {
                    tgSent = true;
                    tgDetails = `Message delivered to Telegram (ID: ${tgData.result?.message_id})`;
                } else {
                    console.warn("Telegram HTML failed, attempting plaintext fallback:", tgData?.description);
                    const plainText = `🔔 طلب معلومات اتصال جديد\n----------------------------\nID: ${requestId}\n👤 الاسم: ${cleanName}\n🏢 الشركة: ${cleanCompany}\n💼 المنصب: ${cleanPosition}\n📧 الإيميل: ${cleanEmail}\n📱 الجوال: ${cleanMobile}${cleanNotes ? `\n📝 ملاحظات: ${cleanNotes}` : ''}\n----------------------------\n✅ للموافقة: /approve_${requestId}\n❌ للرفض: /reject_${requestId}`;
                    const fbRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: plainText
                        })
                    });
                    const fbData = await fbRes.json().catch(() => ({})) as any;
                    if (fbRes.ok && fbData.ok) {
                        tgSent = true;
                        tgDetails = `Message delivered via fallback (ID: ${fbData.result?.message_id})`;
                    } else {
                        tgDetails = fbData?.description || "Failed to deliver Telegram message";
                    }
                }
            } catch (tgErr: any) {
                console.error("Cloudflare Pages Telegram error:", tgErr);
                tgDetails = tgErr.message || "Telegram network error";
            }
        }

        // 2. Backup to Hugging Face dataset if configured (optional, non-blocking)
        if (hfToken && hfDataset) {
            try {
                const jsonString = JSON.stringify(dataRecord, null, 2);
                const b64 = toBase64Utf8(jsonString);

                const hfRes = await fetch(`https://huggingface.co/api/datasets/${hfDataset}/commit/main`, {
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

                if (!hfRes.ok) {
                    const hfData = await hfRes.json().catch(() => ({})) as any;
                    console.warn(`Cloudflare Pages HF backup skipped (HTTP ${hfRes.status}):`, hfData?.error || hfRes.statusText);
                }
            } catch (hfErr: any) {
                console.warn("Cloudflare Pages HF backup skipped:", hfErr.message || hfErr);
            }
        }

        return jsonResponse({
            success: true,
            message: "Request received successfully",
            requestId,
            telegramDelivered: tgSent,
            telegramDetails: tgDetails
        });
    } catch (err: any) {
        return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
    }
}
