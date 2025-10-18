import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type Row = { time: string; score: number; timestamp: string; color?: string };

function findLatestColoredCsv(baseDir: string): string | null {
  const dataDir = path.join(baseDir, '..', 'backend', 'data');
  if (!fs.existsSync(dataDir)) return null;
  const files = fs.readdirSync(dataDir);
  const matches = files
    .map((f) => ({
      name: f,
      match: f.match(/^next_day_predictions_colored_(\d{4}-\d{2}-\d{2})\.csv$/),
    }))
    .filter((x) => x.match);
  if (matches.length === 0) return null;
  matches.sort((a, b) => {
    const da = new Date(a.match![1]).getTime();
    const db = new Date(b.match![1]).getTime();
    return db - da;
  });
  return path.join(dataDir, matches[0].name);
}

function parseCsv(content: string): Row[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(',');
  const idxData = header.indexOf('Data');
  const idxScore = header.indexOf('Scor_pred');
  const idxColor = header.indexOf('Color');
  if (idxData === -1 || idxScore === -1) return [];

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const dateStr = parts[idxData];
    const scoreStr = parts[idxScore];
    if (!dateStr || !scoreStr) continue;
    const ts = new Date(dateStr);
    if (isNaN(ts.getTime())) continue;
    const hh = String(ts.getHours()).padStart(2, '0');
    const mm = String(ts.getMinutes()).padStart(2, '0');
    const n = Number(scoreStr);
    const score = Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
    if (!isFinite(score)) continue;
    const color = idxColor !== -1 ? String(parts[idxColor] || '').toLowerCase() : undefined;
    rows.push({ time: `${hh}:${mm}`, score, timestamp: ts.toISOString(), color });
  }
  return rows;
}

export async function GET() {
  try {
    const baseDir = process.cwd();
    const filePath = findLatestColoredCsv(baseDir);
    if (!filePath) {
      return NextResponse.json(
        { error: 'No colored prediction CSV found. Run backend: make run' },
        { status: 404 }
      );
    }
  const content = fs.readFileSync(filePath, 'utf-8');
    const data = parseCsv(content);
  const stat = fs.statSync(filePath);
  const lastModified = stat.mtime.toISOString();
    // Compute current score from the current time bucket (rounded to nearest 10 min)
  let currentScore: number | null = null;
  let currentColor: string | null = null;
  let currentTime: string | null = null;
    if (data.length > 0) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const bucket = Math.round(now.getMinutes() / 10);
      const mm = String(Math.min(5, bucket) * 10).padStart(2, '0');
      const key = `${hh}:${mm}`;
      const row = data.find((r) => r.time === key);
      if (row) {
        currentScore = Math.round(row.score * 100) / 100;
        currentColor = row.color ?? null;
        // Mark as current reading time to avoid "acum 1 zi" when CSV is from a previous date
        currentTime = new Date().toISOString();
      }
    }
    return NextResponse.json({ data, currentScore, currentColor, currentTime, lastModified, source: path.basename(filePath) });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
