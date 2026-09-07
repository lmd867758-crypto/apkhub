export async function onRequest(context) {
    const { request, env } = context;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    try {
        const body = await request.json();
        const { fileName, content, password } = body;
        const ADMIN_PASS = env.ADMIN_PASSWORD || 'admin123';
        if (password !== ADMIN_PASS) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
        const GITHUB_TOKEN = env.GITHUB_TOKEN;
        if (!GITHUB_TOKEN) return new Response(JSON.stringify({ error: 'GitHub token not configured' }), { status: 500, headers });
        const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = 'assets/icons/' + Date.now() + '-' + safeName;
        const res = await fetch('https://api.github.com/repos/lmd867758-crypto/apkhub/contents/' + path, {
            method: 'PUT',
            headers: { 'Authorization': 'token ' + GITHUB_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Upload icon via admin', content: content, branch: 'main' })
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
        return new Response(JSON.stringify({ success: true, url: 'https://raw.githubusercontent.com/lmd867758-crypto/apkhub/main/' + path }), { headers });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
}
