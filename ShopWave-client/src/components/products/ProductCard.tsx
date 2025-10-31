
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
// import { StarRating } from './StarRating';
import { RatingBadge } from './RatingBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';
import { formatPrice } from '@/lib/format';
import { getAuthToken, api } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem: addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const isProductInWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if card is wrapped in Link
    e.stopPropagation();
    if (!getAuthToken()) {
      router.replace(`/signin?from=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getAuthToken()) {
      router.replace(`/signin?from=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }
    if (isProductInWishlist) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist(product);
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Link href={getAuthToken() ? `/product/${product.id}` : `/signin?from=${encodeURIComponent(`/product/${product.id}`)}`} className="block"
        onClick={() => {
          try {
            void api.recommendationsTracking.click({ userId: null, productIdClicked: product.id, recommendationId: undefined, source: 'product_card' });
          } catch { /* ignore */ }
        }}
      >
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
        <Link href={`/product/${product.id}`} className="block" onClick={() => {
            try {
              void api.recommendationsTracking.click({ userId: null, productIdClicked: product.id, recommendationId: undefined, source: 'product_card' });
            } catch { /* ignore */ }
          }}>
          <CardTitle className="text-lg font-semibold mb-1 hover:text-primary transition-colors">{product.name}</CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-2 min-h-[2.25rem]">
          <p className="text-lg font-semibold text-primary leading-snug" aria-label={`Giá ${formatPrice(product.price)}`}>{formatPrice(product.price)}</p>
          <RatingBadge rating={product.rating} />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <Button 
          onClick={handleAddToCart} 
          variant="default" 
          size="sm" 
          className="flex-grow transition-transform transform hover:scale-105"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
        <Button 
          onClick={handleToggleWishlist} 
          variant="outline" 
          size="icon" 
          className={cn(
            "transition-colors transform hover:scale-110",
            isProductInWishlist ? "text-accent border-accent hover:bg-accent/10" : "text-muted-foreground"
          )}
          aria-label={isProductInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart className={cn("h-5 w-5", isProductInWishlist ? "fill-accent" : "")} />
        </Button>
      </CardFooter>
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
      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <Skeleton className="h-10 flex-grow" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </CardFooter>
    </Card>
  );
}
