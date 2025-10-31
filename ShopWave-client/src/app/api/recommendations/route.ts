import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

async function forwardToBackend(path: string, init: RequestInit = {}) {
  const url = `${API_BASE.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, init);
  const body = await res.arrayBuffer();
  const headers: Record<string, string> = {};
  const contentType = res.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;
  return new Response(body, { status: res.status, headers });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search;
  // Forward cookies for auth if present
  const headers: Record<string, string> = {};
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;
  headers['accept'] = req.headers.get('accept') || 'application/json';
  return forwardToBackend(`/api/v1/recommendations${qs}`, { method: 'GET', headers });
}

export async function POST(req: Request) {
  // Forward body and cookies to backend POC
  const cookie = req.headers.get('cookie');
  const headers: Record<string, string> = {
    'content-type': req.headers.get('content-type') || 'application/json'
  };
  if (cookie) headers['cookie'] = cookie;
  const body = await req.arrayBuffer();
  return forwardToBackend('/api/v1/recommendations', { method: 'POST', headers, body });
}
