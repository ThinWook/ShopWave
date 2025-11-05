
"use client";
// @ts-nocheck

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import type { FEProduct as Product, FEReview as Review } from '@/lib/api';
import { api, UnauthorizedError } from '@/lib/api';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { useProducts } from '@/contexts/ProductContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';
import ProductGallery from '@/components/products/ProductGallery';
import ProductPurchasePanel from '@/components/products/ProductPurchasePanel';
import ProductDetailsTabs from '@/components/products/ProductDetailsTabs';
import ProductGrid from '@/components/products/ProductGrid';

// Reviews and suggestions removed from scope

export default function ProductDetailPage(props: { params: any }) {
  const router = useRouter();
  const { getProductById, addToBrowsingHistory, reload } = useProducts();
  const { addItem: addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined for loading, null for not found
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState<boolean>(true);
  
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
            // do not trigger global catalog reload from detail page
        }
        if (cancelled) return;
        setProduct(existing ?? null);
        if (existing) {
          addToBrowsingHistory(existing.id);
          // Reviews are intentionally not loaded on the product detail page to
          // avoid additional API traffic. The reviews UI has been removed from
          // the current scope; keep `reviews` state empty.
          setReviews([]);

          // Load related products (same category) in parallel
          try {
            setRelatedLoading(true);
            const rel = await api.products.related(existing.id, 8);
            if (!cancelled) {
              // Ensure same category and exclude current product (defensive)
              const filtered = (rel || [])
                .filter(p => p.id !== existing.id)
                .filter(p => !existing.category || !p.category || p.category === existing.category);
              setRelatedProducts(filtered);
            }
          } catch {
            if (!cancelled) setRelatedProducts([]);
          } finally {
            if (!cancelled) setRelatedLoading(false);
          }
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

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  return (
    <div className="container mx-auto py-8">
    {/* Back to Products link removed per request */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-lg sticky top-24">
          <ProductGallery images={(product.galleryImages && product.galleryImages.length) ? product.galleryImages : [{ url: product.imageUrl, thumbnailUrl: product.imageUrl }]} />
        </div>
        <div className="space-y-6">
          <ProductPurchasePanel
            product={product}
            onAddToCart={(variantId, quantity) => {
              // If a variantId was chosen and it represents a specific product id, use it; otherwise fallback to main product
              const prodForCart = variantId ? { ...product, id: variantId } : product;
              addToCart(prodForCart, quantity);
              toast({ title: 'Added to Cart', description: `${product.name} đã được thêm vào giỏ hàng.` });
            }}
            onBuyNow={(variantId, quantity) => {
              const prodForCart = variantId ? { ...product, id: variantId } : product;
              addToCart(prodForCart, quantity).then(() => {
                // Navigate to checkout - simple redirect
                router.push('/checkout');
              });
            }}
          />
          {/* Wishlist removed per project scope */}
        </div>
      </div>

      <div className="mt-12">
        <ProductDetailsTabs product={product as any} />
      </div>

      {/* Related products (same category) */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Sản phẩm cùng loại</h2>
        <ProductGrid products={relatedProducts} isLoading={relatedLoading} skeletonsCount={4} />
      </div>

  {/* Reviews and product suggestions removed */}
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

