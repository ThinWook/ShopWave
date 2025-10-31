
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    const quantity = Math.max(1, newQuantity); // Ensure quantity is at least 1
    updateQuantity(item.id, quantity);
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href={`/product/${item.id}`} className="shrink-0">
        <Image
          src={resolveMediaUrl(item.imageUrl)}
          alt={item.name}
          width={100}
          height={100}
          className="rounded-md object-cover aspect-square"
          data-ai-hint={item.imageAiHint || "product image"}
        />
      </Link>
      <div className="flex-grow">
        <Link href={`/product/${item.id}`}>
          <h3 className="text-lg font-semibold hover:text-primary transition-colors">{item.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{item.category}</p>
        <p className="text-md font-medium text-primary mt-1">${item.price.toFixed(2)}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.quantity - 1)} disabled={item.quantity <= 1} className="h-8 w-8">
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
            min="1"
            className="h-8 w-12 text-center hide-arrows [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label={`Quantity for ${item.name}`}
          />
          <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.quantity + 1)} className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-md font-semibold">
          Total: ${(item.price * item.quantity).toFixed(2)}
        </p>
        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="mr-1 h-4 w-4" /> Remove
        </Button>
      </div>
      <style jsx global>{`
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
