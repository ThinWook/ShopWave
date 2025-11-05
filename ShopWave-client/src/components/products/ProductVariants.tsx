"use client";
import React from 'react';
import { Check } from 'lucide-react';
import type { VariantDto } from '@/lib/api';

type Variant = VariantDto & { imageUrl?: string | null };

export default function ProductVariants({
	variants = [],
	selectedColor,
	selectedSize,
	onSelectColor = () => {},
	onSelectSize = () => {},
}: {
	variants?: Variant[];
	selectedColor?: string | null;
	selectedSize?: string | null;
	onSelectColor?: (c: string) => void;
	onSelectSize?: (s: string) => void;
}) {
	// normalize
	const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];
	const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];

	if (!variants || variants.length === 0) return null;

	return (
		<div className="space-y-3">
			{colors.length > 0 && (
				<div>
					<div className="text-sm font-semibold mb-2">Color</div>
					<div className="flex items-center gap-2">
						{colors.map((c) => {
							const isSelected = c === selectedColor;
							// attempt to render color string as background if it's a valid CSS color, otherwise show label
							const swatch = (
								<span
									aria-hidden
									className="inline-block w-8 h-8 rounded-full border"
									style={{ backgroundColor: c ?? undefined }}
								/>
							);

							return (
								<button
									key={c}
									onClick={() => onSelectColor(c)}
									type="button"
									className={`relative rounded-md p-0.5 focus:outline-none ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
									aria-pressed={isSelected}
									title={c}
								>
									{swatch}
									{isSelected && (
										<span className="absolute inset-0 flex items-center justify-center">
											<Check className="text-white" size={14} />
										</span>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}

			{sizes.length > 0 && (
				<div>
					<div className="text-sm font-semibold mb-2">Size</div>
					<div className="flex items-center gap-2 flex-wrap">
						{sizes.map((s) => {
							const isSelected = s === selectedSize;
							return (
								<button
									key={s}
									type="button"
									onClick={() => onSelectSize(s)}
									className={`px-3 py-1 rounded-md border text-sm ${isSelected ? 'bg-primary text-white border-primary' : 'bg-transparent text-foreground border-border'}`}
								>
									{s}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

