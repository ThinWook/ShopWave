import { NextResponse } from 'next/server';

// Minimal placeholder handlers for cart voucher endpoint.
// These are lightweight implementations so the frontend calls do not 404
// during development. Replace with real business logic as needed.

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}));
		const code = String((body && body.code) || 'UNKNOWN');
		// Return a minimal cart-shaped envelope. Real implementation should
		// validate the voucher and return updated cart data.
		const payload = {
			success: true,
			message: 'VOUCHER_APPLIED',
			data: {
				items: [],
				applied_voucher: { code, discount_amount: 0, description: null },
				available_vouchers: [],
				totalItems: 0,
				subTotal: 0,
				shippingFee: 0,
				total: 0,
			},
			errors: [],
		};
		return NextResponse.json(payload);
	} catch (err) {
		return NextResponse.json({ success: false, message: 'INTERNAL_ERROR', data: null, errors: [{ message: 'Invalid request' }] }, { status: 500 });
	}
}

export async function DELETE() {
	// Minimal implementation: remove applied voucher
	const payload = {
		success: true,
		message: 'VOUCHER_REMOVED',
		data: {
			items: [],
			applied_voucher: null,
			available_vouchers: [],
			totalItems: 0,
			subTotal: 0,
			shippingFee: 0,
			total: 0,
		},
		errors: [],
	};
	return NextResponse.json(payload);
}
