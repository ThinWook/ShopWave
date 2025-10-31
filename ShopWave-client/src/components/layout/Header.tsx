
"use client";

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShoppingBag, Heart, User, Menu, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const ProductSearch = dynamic(() => import('@/components/products/ProductSearch').then(m => m.ProductSearch), {
  loading: () => <div className="w-full max-w-lg h-10 rounded-md bg-muted" />,
});

export default function Header() {
  const { getItemCount } = useCart();
  const { state: wishlistState } = useWishlist();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'All Products' },
    // Add more categories or links here if needed
  ];

  const NavLinkItems = ({isMobile = false}: {isMobile?: boolean}) => (
    <>
      {navLinks.map(link => (
        <Button key={link.label} variant="ghost" asChild className={isMobile ? "w-full justify-start" : ""}>
          <Link href={link.href} onClick={() => isMobile && setIsSheetOpen(false)}>{link.label}</Link>
        </Button>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary/80 transition-colors">
          <Mountain className="h-6 w-6" />
          <span className="font-bold">ShopWave</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 md:ml-6 lg:ml-8">
          <NavLinkItems />
        </nav>
        
        <div className="hidden md:flex flex-1 justify-center px-4">
           <ProductSearch />
        </div>


        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="relative hover:bg-accent/10 transition-colors">
            <Link href="/wishlist" aria-label="View Wishlist">
              <Heart className="h-5 w-5" />
              {wishlistState.items.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {wishlistState.items.length}
                </Badge>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative hover:bg-accent/10 transition-colors">
            <Link href="/cart" aria-label="View Cart">
              <ShoppingBag className="h-5 w-5" />
              {getItemCount() > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {getItemCount()}
                </Badge>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="hover:bg-accent/10 transition-colors">
            <Link href="/profile" aria-label="User Profile"> {/* Placeholder for profile */}
              <User className="h-5 w-5" />
            </Link>
          </Button>
          
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm">
                <div className="p-4">
                  <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary mb-4" onClick={() => setIsSheetOpen(false)}>
                    <Mountain className="h-6 w-6" />
                    ShopWave
                  </Link>
                  <div className="mb-4">
                    <ProductSearch />
                  </div>
                  <nav className="flex flex-col gap-2">
                    <NavLinkItems isMobile={true} />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
