export async function onRequestPost(): Promise<Response> {
    return new Response(JSON.stringify({
        error: "On static edge deployment (Cloudflare Pages), please paste your hosted CV URL directly in the CV Resource field."
    }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
    });
}
