import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

async function forward(path: string, init: RequestInit = {}) {
  const url = `${API_BASE.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, init);
  const body = await res.arrayBuffer();
  const headers: Record<string, string> = {};
  const contentType = res.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;
  return new Response(body, { status: res.status, headers });
}

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie');
  const headers: Record<string, string> = {
    'content-type': req.headers.get('content-type') || 'application/json'
  };
  if (cookie) headers['cookie'] = cookie;
  const body = await req.arrayBuffer();
  return forward('/api/v1/recommendations/impression', { method: 'POST', headers, body });
}
