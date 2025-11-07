import { NextResponse } from 'next/server';

// Minimal GET handler for /api/v1/vouchers/available
export async function GET() {
	const payload = {
		success: true,
		message: 'VOUCHERS_RETRIEVED',
		data: [],
		errors: [],
	};
	return NextResponse.json(payload);
}
