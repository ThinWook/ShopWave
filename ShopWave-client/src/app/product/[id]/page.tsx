
"use client";
// @ts-nocheck

import { useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/products/StarRating';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import type { FEProduct as Product, FEReview as Review } from '@/lib/api';
import { api, UnauthorizedError } from '@/lib/api';
import { Heart, ShoppingCart, ChevronLeft } from 'lucide-react';
import { useProducts } from '@/contexts/ProductContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';

// Lazy-load secondary sections
const ProductReviews = dynamic(() => import('@/components/products/ProductReviews').then(m => m.ProductReviews), {
  loading: () => (
    <div className="mt-8">
      <Skeleton className="h-8 w-56 mb-4" />
      <Skeleton className="h-32 w-full" />
    </div>
  ),
});

const ProductSuggestions = dynamic(() => import('@/components/products/ProductSuggestions').then(m => m.ProductSuggestions), {
  loading: () => (
    <div className="mt-8">
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg">
            <div className="relative aspect-square">
              <Skeleton className="w-full h-full" />
            </div>
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
});

export default function ProductDetailPage(props: { params: any }) {
  const router = useRouter();
  const { getProductById, addToBrowsingHistory, reload } = useProducts();
  const { addItem: addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined for loading, null for not found
  const [reviews, setReviews] = useState<Review[]>([]);
  
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const p = typeof props.params?.then === 'function' ? await props.params : props.params;
        // First try existing context product to avoid extra network if already loaded
        let existing = getProductById(p.id);
        if (!existing) {
          // attempt fetch directly
            existing = await api.products.get(p.id);
            // optional: reload overall catalog after single fetch
            reload().catch(()=>{});
        }
        if (cancelled) return;
        setProduct(existing ?? null);
        if (existing) {
          addToBrowsingHistory(existing.id);
          try {
            const reviewPaged = await api.products.reviews(existing.id, 1, 20);
            if (!cancelled) {
              // Map ReviewDto to Review (already compatible fields except comment nullable)
              setReviews(reviewPaged.data.map(r => ({
                id: r.id,
                userName: r.userName,
                rating: r.rating,
                comment: r.comment || '',
                date: r.date,
                productId: existing!.id,
                verified: r.isVerified
              })));
            }
          } catch { /* ignore reviews error */ }
        }
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          // Redirect to signin with return url
          const p = typeof props.params?.then === 'function' ? await props.params : props.params;
          const from = `/product/${p.id}`;
          router.replace(`/signin?from=${encodeURIComponent(from)}`);
          return;
        }
        if (!cancelled) setProduct(null);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.params, getProductById, addToBrowsingHistory, reload]);

  if (product === undefined) { // Loading state
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">Sorry, we couldn&apos;t find the product you&apos;re looking for.</p>
        <Button asChild>
          <Link href="/"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Shop</Link>
        </Button>
      </div>
    );
  }

  const isProductInWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleWishlist = () => {
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
    <div className="container mx-auto py-8">
      <Button variant="outline" asChild className="mb-6">
         <Link href="/"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Products</Link>
      </Button>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-lg sticky top-24">
          <div className="relative aspect-square w-full overflow-hidden rounded-md">
            <Image
              src={resolveMediaUrl(product.imageUrl)}
              alt={product.name}
              width={600}
              height={600}
              className="object-cover w-full h-full rounded border"
              priority
              data-ai-hint={product.imageAiHint || "product image detail"}
            />
          </div>
        </div>
        <div className="space-y-6">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
          <div className="flex items-center space-x-2">
            <StarRating rating={product.rating} size={24} />
            <span className="text-muted-foreground text-sm">({product.reviewsCount} reviews)</span>
          </div>
          <p className="text-3xl font-semibold text-primary">${product.price.toFixed(2)}</p>
          <p className="text-foreground/80 leading-relaxed">{product.description}</p>
          
          <div className="py-4 border-t border-b">
            <h3 className="text-md font-semibold mb-2">Category: <span className="font-normal text-muted-foreground">{product.category}</span></h3>
            {product.attributes && Object.entries(product.attributes).map(([key, value]) => (
                 <h3 key={key} className="text-md font-semibold mb-1 capitalize">{key}: <span className="font-normal text-muted-foreground">{value}</span></h3>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={handleAddToCart} className="flex-1 transition-transform transform hover:scale-105">
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleToggleWishlist} 
              className={cn(
                "flex-1 transition-colors transform hover:scale-105",
                isProductInWishlist ? "text-accent border-accent hover:bg-accent/10" : "text-muted-foreground"
              )}
            >
              <Heart className={cn("mr-2 h-5 w-5", isProductInWishlist ? "fill-accent" : "")} /> 
              {isProductInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </Button>
          </div>
        </div>
      </div>

      <ProductReviews reviews={reviews} productId={product.id} />
      <ProductSuggestions currentProductId={product.id} context="product_page" title="Customers Also Viewed" />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-10 w-40 mb-6" /> {/* Back button skeleton */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-lg">
          <Skeleton className="w-full aspect-square rounded-md" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" /> {/* Product name */}
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-28" /> {/* Star rating */}
            <Skeleton className="h-4 w-20" /> {/* Reviews count */}
          </div>
          <Skeleton className="h-10 w-1/4" /> {/* Price */}
          <Skeleton className="h-5 w-full" /> {/* Description line 1 */}
          <Skeleton className="h-5 w-full" /> {/* Description line 2 */}
          <Skeleton className="h-5 w-2/3 mb-4" /> {/* Description line 3 */}
          
          <div className="py-4 border-t border-b space-y-2">
            <Skeleton className="h-5 w-1/2" /> {/* Category */}
            <Skeleton className="h-5 w-1/3" /> {/* Attribute */}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-12 flex-1" /> {/* Add to cart button */}
            <Skeleton className="h-12 flex-1" /> {/* Wishlist button */}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Skeleton className="h-10 w-1/3 mb-4" /> {/* Reviews title */}
        <Skeleton className="h-40 w-full" /> {/* Reviews content */}
      </div>
      <div className="mt-8">
        <Skeleton className="h-10 w-1/3 mb-4" /> {/* Suggestions title */}
        <Skeleton className="h-64 w-full" /> {/* Suggestions content */}
      </div>
    </div>
  );
}

