import { NextResponse } from 'next/server';

// This endpoint returns available vouchers for the cart.
// Response shape based on the JSON provided by the user.
export async function GET() {
  const payload = {
    success: true,
    message: 'VOUCHERS_RETRIEVED',
    data: [],
    errors: [],
    meta: {
      durationMs: 0,
      traceId: '00-000000000000000-000000000000000-00',
      generatedAt: new Date().toISOString(),
    },
  };
  return NextResponse.json(payload);
}
