interface Env {
    [key: string]: any;
}

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-pin",
};

export async function onRequestOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
    const pin = context.request.headers.get("x-admin-pin");
    if (pin !== "2026") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: {
                "Content-Type": "application/json",
                ...CORS_HEADERS,
            }
        });
    }

    return new Response(JSON.stringify({ 
        requests: [],
        notice: "On Cloudflare Pages, inquiries are dispatched in real-time to your configured Telegram bot."
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
        }
    });
}
