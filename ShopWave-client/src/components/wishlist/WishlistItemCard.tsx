
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X, ShoppingCart } from 'lucide-react';
import type { WishlistItem, Product } from '@/lib/types';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { StarRating } from '@/components/products/StarRating';
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { resolveMediaUrl } from '@/lib/media';

interface WishlistItemCardProps {
  item: WishlistItem;
}

export function WishlistItemCard({ item }: WishlistItemCardProps) {
  const router = useRouter();
  const { removeFromWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { toast } = useToast();

  const handleRemoveFromWishlist = () => {
    if (!getAuthToken()) {
      router.replace(`/signin?from=${encodeURIComponent('/wishlist')}`);
      return;
    }
    removeFromWishlist(item.id);
    toast({
        title: "Removed from Wishlist",
        description: `${item.name} has been removed from your wishlist.`,
    });
  };
  
  const handleAddToCart = () => {
    if (!getAuthToken()) {
      router.replace(`/signin?from=${encodeURIComponent('/wishlist')}`);
      return;
    }
    addToCart(item as Product); // Cast because WishlistItem is Product
    removeFromWishlist(item.id); // Optionally remove from wishlist after adding to cart
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`,
    });
  };


  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-card relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleRemoveFromWishlist} 
        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
        aria-label={`Remove ${item.name} from wishlist`}
      >
        <X className="h-5 w-5" />
      </Button>
      <Link href={`/product/${item.id}`} className="shrink-0">
        <Image
          src={resolveMediaUrl(item.imageUrl)}
          alt={item.name}
          width={120}
          height={120}
          className="rounded-md object-cover aspect-square"
          data-ai-hint={item.imageAiHint || "product image"}
        />
      </Link>
      <div className="flex-grow text-center sm:text-left">
        <Link href={`/product/${item.id}`}>
          <h3 className="text-xl font-semibold hover:text-primary transition-colors">{item.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{item.category}</p>
        <div className="my-2 flex justify-center sm:justify-start">
          <StarRating rating={item.rating} size={18} />
        </div>
        <p className="text-lg font-medium text-primary">${item.price.toFixed(2)}</p>
      </div>
      <Button onClick={handleAddToCart} className="mt-2 sm:mt-0 sm:ml-auto w-full sm:w-auto transition-transform transform hover:scale-105">
        <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
      </Button>
    </div>
  );
}
