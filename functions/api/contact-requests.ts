interface Env {
    [key: string]: any;
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
    const pin = context.request.headers.get("x-admin-pin");
    if (pin !== "2026") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    // On Cloudflare Pages Edge, requests are routed directly to Telegram / HF.
    return new Response(JSON.stringify({ 
        requests: [],
        notice: "On Cloudflare Pages, inquiries are dispatched in real-time to your configured Telegram bot."
    }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
