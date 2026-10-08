import { backendUrl } from "@/lib/backend";
export async function GET() {
  try {
    const resp = await fetch(backendUrl("windows"), { cache: "no-store" });
    const text = await resp.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { ok: false, error: 'Non-JSON response from backend', raw: text };
    }
    return new Response(JSON.stringify(json), {
      status: resp.ok ? 200 : resp.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
