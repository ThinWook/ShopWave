
"use client";

import { useWishlist } from '@/contexts/WishlistContext';
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function WishlistPage() {
  useRequireAuth();
  const { state } = useWishlist();

  if (state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
        <p className="text-muted-foreground mb-8">
          Save your favorite items here to easily find them later.
        </p>
        <Button asChild size="lg">
          <Link href="/">Discover Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">My Wishlist</h1>
      <div className="grid grid-cols-1 gap-6">
        {state.items.map((item) => (
          <WishlistItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
