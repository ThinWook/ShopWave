"use client";
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

type GalleryImage = {
	id?: string | number;
	url?: string | null;
	thumbnailUrl?: string | null;
	caption?: string | null;
	src?: string | null;
};
export default function ProductGallery({ images = [], initialIndex = 0 }: { images?: GalleryImage[]; initialIndex?: number }) {
	const normalized = images.length > 0 ? images : [{ url: null }];
	const [index, setIndex] = useState<number>(Math.min(Math.max(0, initialIndex), normalized.length - 1));
	const containerRef = useRef<HTMLDivElement | null>(null);
	const touchStartX = useRef<number | null>(null);
	const touchStartY = useRef<number | null>(null);
	useEffect(() => {
		setIndex(Math.min(Math.max(0, initialIndex), normalized.length - 1));
	}, [initialIndex, normalized.length]);

	const prev = () => setIndex(i => (i - 1 + normalized.length) % normalized.length);
	const next = () => setIndex(i => (i + 1) % normalized.length);

	const onTouchStart = (e: React.TouchEvent) => {
		const t = e.touches[0];
		touchStartX.current = t.clientX;
		touchStartY.current = t.clientY;
	};

	const onTouchEnd = (e: React.TouchEvent) => {
		if (touchStartX.current == null) return;
		const t = e.changedTouches[0];
		const dx = t.clientX - (touchStartX.current ?? 0);
		const dy = t.clientY - (touchStartY.current ?? 0);
		// only horizontal swipes
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
			if (dx < 0) next(); else prev();
		}
		touchStartX.current = null;
		touchStartY.current = null;
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'ArrowRight') next();
	};

		return (
			<div className="flex items-start gap-4">
				{/* Thumbnails column - vertical on md+, horizontal below on small */}
				<div className="hidden md:flex flex-col gap-3 w-20 max-h-[560px] overflow-y-auto px-1" role="tablist" aria-orientation="vertical">
				{normalized.map((img, i) => {
						const thumb = img.thumbnailUrl ?? img.url ?? img.src ?? '';
						return (
							<button
								key={String(img.id ?? i)}
								onClick={() => setIndex(i)}
								className={cn(
									"flex items-center justify-center rounded-sm bg-white p-1 shadow-sm focus:outline-none",
									i === index ? 'border-2 border-black' : 'border border-transparent'
								)}
								aria-label={`Select image ${i + 1}`}
								aria-selected={i === index}
							>
								<div className="relative w-16 h-16">
									<Image src={resolveMediaUrl(thumb)} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="64px" />
								</div>
							</button>
						);
				})}
			</div>

			{/* Main slider */}
				<div
					ref={containerRef}
					className="relative flex-1 max-w-full"
					onTouchStart={onTouchStart}
					onTouchEnd={onTouchEnd}
					onKeyDown={onKeyDown}
					tabIndex={0}
					aria-roledescription="carousel"
					aria-label="Product image gallery"
				>
					{/* Light background area like mock */}
					<div className="bg-gray-100 p-6 rounded-md">
						{/* Lightbox anchor (fancybox or similar will pick data-fancybox) */}
												<a
													data-fancybox="gallery"
													data-caption={String(normalized[index].caption ?? '')}
													href={resolveMediaUrl(normalized[index].url ?? normalized[index].src ?? '')}
													aria-hidden
													className="group block"
												>
													<div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm">
														<Image
															src={resolveMediaUrl(normalized[index].url ?? normalized[index].src ?? '')}
															alt={String(normalized[index].caption ?? `Product image ${index + 1}`)}
															width={800}
															height={1000}
															className="object-contain w-full h-full bg-gray-100 transition-transform duration-300 md:group-hover:scale-105"
															priority={index === 0}
														/>
													</div>
												</a>
					</div>

					{/* Prev/Next buttons - overlay similar to mock */}
					<button
						onClick={prev}
						aria-label="Previous image"
						className="absolute left-2 top-1/2 -translate-y-1/2 items-center justify-center h-10 w-10 rounded-full bg-white/90 shadow-md hover:bg-white focus:outline-none"
					>
						<ChevronLeft size={18} />
					</button>
					<button
						onClick={next}
						aria-label="Next image"
						className="absolute right-2 top-1/2 -translate-y-1/2 items-center justify-center h-10 w-10 rounded-full bg-white/90 shadow-md hover:bg-white focus:outline-none"
					>
						<ChevronRight size={18} />
					</button>

					{/* Mobile thumbnails row */}
					<div className="flex md:hidden gap-2 mt-3 overflow-x-auto">
						{normalized.map((img, i) => (
							<button
								key={String(img.id ?? i)}
								onClick={() => setIndex(i)}
								className={cn("flex items-center justify-center rounded-sm bg-white p-1 shadow-sm", i === index ? 'border-2 border-black' : 'border border-transparent')}
								aria-label={`Select image ${i + 1}`}
							>
								<div className="relative w-16 h-16">
									<Image src={resolveMediaUrl(img.thumbnailUrl ?? img.url ?? img.src ?? '')} alt={`Thumb ${i + 1}`} fill className="object-cover" />
								</div>
							</button>
						))}
					</div>
				</div>
		</div>
	);
}
