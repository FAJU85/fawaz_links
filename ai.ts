import { z } from "zod";

// Zod Schema with support for absolute URLs and relative asset paths
export const CmsDataSchema = z.object({
    availability: z.enum(["available", "busy", "unavailable"]),
    cv_url: z.string().min(1).refine(
        (val) => val.startsWith("/") || val.startsWith("./") || /^https?:\/\//i.test(val),
        { message: "Must be a valid URL or relative file path" }
    ),
    bio_ar: z.string(),
    bio_en: z.string(),
    fullName: z.string(),
    pin: z.string(),
    systemPrompt: z.string()
});

export type CmsData = z.infer<typeof CmsDataSchema>;

/**
 * Client-side AI query helper.
 * Calls the secure backend proxy route (/api/ai-chat).
 */
export async function askAI(query: string, context: string = "", systemPrompt?: string): Promise<string> {
    try {
        const response = await fetch("/api/ai-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, context, systemPrompt })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();
        return data.response || "عذراً، لم أتمكن من الحصول على رد في الوقت الحالي.";
    } catch (error) {
        console.error("AI Client Error:", error);
        return "أهلاً بك! أنا المساعد الذكي الخاص بفواز الجبيلي. يمكنك استعراض السيرة الذاتية أو إرسال طلب تواصل مباشر عبر النموذج أدناه.";
    }
}

/**
 * Client-side content optimization helper.
 */
export async function optimizeContent(original: string, language: "ar" | "en" = "ar"): Promise<string> {
    const prompt = language === "ar" 
        ? `بصفتك مستشاراً مهنياً، يرجى تحسين هذه النبذة الشخصية لتكون أكثر احترافية وجاذبية: "${original}"`
        : `As a professional career consultant, please optimize this bio to be more impactful and professional: "${original}"`;
    
    return await askAI(prompt, "Task: Content Optimization");
}
