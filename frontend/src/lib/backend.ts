export function backendUrl(endpoint: string): string {
  const base = process.env.BACKEND_URL || "http://127.0.0.1:5000";
  return `${base.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
}
