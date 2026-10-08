import { backendUrl } from "@/lib/backend";
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { when } = body || {};

    const url = new URL(backendUrl("decision"));

    const resp = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(when ? { when } : {}),
    });
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

export async function GET() {
  // For convenience, allow GET passthrough without when
  try {
    const resp = await fetch(backendUrl("decision"), { cache: "no-store" });
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
