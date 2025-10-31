import React from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type Rec = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | null;
  score: number;
  reason?: string;
};

export default async function RecommendationsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const q = new URLSearchParams();
  if (searchParams?.userId) q.set('userId', String(searchParams.userId));
  if (searchParams?.productId) q.set('productId', String(searchParams.productId));
  if (searchParams?.k) q.set('k', String(searchParams.k));

  const url = `${API_BASE.replace(/\/$/, '')}/api/v1/recommendations?${q.toString()}`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return (
        <main className="p-6">
          <h1>Recommendations</h1>
          <p>Failed to load recommendations.</p>
        </main>
      );
    }
    const body = await res.json();
    const recs: Rec[] = Array.from(body.recommendations || []).map((r: any) => ({
      id: r.id ?? String(r),
      title: r.title ?? r.name ?? String(r),
      price: Number(r.price ?? 0),
      imageUrl: r.imageUrl ?? null,
      score: Number(r.score ?? r.rating ?? 0),
      reason: r.reason ?? ''
    }));

    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Recommendations (used: {body.fallbackUsed ?? 'unknown'})</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recs.map(r => (
            <li key={r.id} className="border rounded p-3">
              <a href={`/product/${r.id}`}>
                <img src={r.imageUrl ?? '/placeholder.png'} alt={r.title} width={160} />
                <div className="font-medium mt-2">{r.title}</div>
                <div className="text-sm text-muted-foreground">{r.price.toFixed(2)} ₫</div>
                <div className="text-xs text-muted-foreground">score: {r.score.toFixed(2)} {r.reason ? `(${r.reason})` : ''}</div>
              </a>
            </li>
          ))}
        </ul>
      </main>
    );
  } catch (err) {
    return (
      <main className="p-6">
        <h1>Recommendations</h1>
        <p>Failed to load recommendations (error).</p>
      </main>
    );
  }
}
