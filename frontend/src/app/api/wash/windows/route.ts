export async function GET() {
  try {
    const resp = await fetch('http://127.0.0.1:5000/windows');
    const text = await resp.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { ok: false, error: 'Non-JSON response from backend', raw: text };
    }
    return new Response(JSON.stringify(json), {
      status: resp.ok ? 200 : resp.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
