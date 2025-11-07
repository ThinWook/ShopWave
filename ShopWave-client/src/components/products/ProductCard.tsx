
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveMediaUrl } from '@/lib/media';
import { formatPrice } from '@/lib/format';
import { api } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();


  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
  <Link href={`/product/${product.id}`} className="block">
        <CardHeader className="p-0 relative aspect-square overflow-hidden rounded-lg">
          <Image
            src={resolveMediaUrl(product.imageUrl)}
            alt={product.name}
            width={400}
            height={400}
            className="object-cover w-full h-full rounded border"
            data-ai-hint={product.imageAiHint || "product image"}
            priority={product.id === '1' || product.id === '2'} // Prioritize LCP images
            loading={product.id === '1' || product.id === '2' ? undefined : "lazy"} // Lazy load others
          />
        </CardHeader>
      </Link>
      <CardContent className="p-4 flex-grow">
        <Link href={`/product/${product.id}`} className="block">
          <CardTitle className="text-lg font-semibold mb-1 hover:text-primary transition-colors">{product.name}</CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
        <div className="flex items-center mb-2 min-h-[2.25rem]">
          <p className="text-lg font-semibold text-primary leading-snug" aria-label={`Giá ${formatPrice(product.price)}`}>{formatPrice(product.price)}</p>
        </div>
      </CardContent>
      {/* Action buttons removed as requested */}
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg">
      <CardHeader className="p-0 relative aspect-square">
        <Skeleton className="w-full h-full" />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}
