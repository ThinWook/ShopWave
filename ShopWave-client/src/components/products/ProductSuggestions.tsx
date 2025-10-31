
"use client";

import { useEffect, useState }
from 'react';
// Call server API instead of importing server action directly
import { useProducts } from '@/contexts/ProductContext';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductGrid } from './ProductGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Zap } from 'lucide-react'; // Zap for AI suggestions

interface ProductSuggestionsProps {
  currentProductId?: string; // To exclude current product from suggestions
  title?: string;
  context?: 'product_page' | 'cart_page' | 'homepage'; // Context for potentially different recommendation strategies
}

export function ProductSuggestions({ currentProductId, title = "Recommended For You", context = 'homepage' }: ProductSuggestionsProps) {
  const { allProducts, browsingHistory, getProductById } = useProducts();
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      setIsLoading(true);
      setError(null);
      
      // Use recent browsing history, or a generic seed if history is empty
      let historyToUse = browsingHistory;
      if(historyToUse.length === 0 && allProducts.length > 0) {
        // Fallback: use a few popular/random products as seed if no history
        historyToUse = allProducts.slice(0, 3).map(p => p.id);
      }
      
      if (historyToUse.length === 0) {
         // If still no history (e.g. no products at all), show some random products or nothing
        const randomProducts = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 4);
        setSuggestedProducts(randomProducts.filter(p => p.id !== currentProductId));
        setIsLoading(false);
        return;
      }

      // Convert product IDs from history to names for the AI flow, if possible
      const productNamesHistory = historyToUse.map(id => getProductById(id)?.name || id).join(', ');

      try {
        // Use centralized API client to call backend recommendation service (POC).
        const recArray = await api.recommendations.get(productNamesHistory || []);

        // recArray is expected to be an array of product IDs or product names. Normalize to array of strings.
        const recommendationIdsOrNames = Array.isArray(recArray) ? recArray.map(String) : [];

        const resolvedProducts: Product[] = recommendationIdsOrNames.map(idOrName => {
          // Try to find by ID first, then by name as a fallback
          let product = getProductById(idOrName);
          if (!product) {
            product = allProducts.find(p => p.name.toLowerCase() === idOrName.toLowerCase());
          }
          return product;
        }).filter((p): p is Product => p !== undefined && p.id !== currentProductId); // Filter out undefined and current product
          
          // If recommendations return too few, supplement with random popular items
          if(resolvedProducts.length < 4 && allProducts.length > 0) {
            const popularProducts = [...allProducts]
              .sort((a,b) => b.popularity - a.popularity)
              .filter(p => p.id !== currentProductId && !resolvedProducts.find(rp => rp.id === p.id)); // not current, not already suggested
            
            const needed = 4 - resolvedProducts.length;
            resolvedProducts.push(...popularProducts.slice(0, needed));
          }

          setSuggestedProducts(resolvedProducts.slice(0,4)); // Show max 4 suggestions
      } catch (err) {
  console.error('Failed to fetch product suggestions:', err);
        setError('Could not load suggestions at this time.');
        // Fallback to random products on error
        const fallbackProducts = allProducts.filter(p => p.id !== currentProductId).sort(() => 0.5 - Math.random()).slice(0, 4);
        setSuggestedProducts(fallbackProducts);
      } finally {
        setIsLoading(false);
      }
    }

    if(allProducts.length > 0) { // Only fetch if there are products to recommend from
        fetchSuggestions();
    } else {
        setIsLoading(false);
        setSuggestedProducts([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProductId, browsingHistory.join(','), allProducts, getProductById]); // re-run if history or products change

  if (error && !isLoading && suggestedProducts.length === 0) { // Only show error if no fallbacks displayed
    return (
        <Card className="mt-8 shadow-md">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Zap className="mr-2 h-5 w-5 text-accent" />{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-destructive flex items-center"><AlertCircle className="mr-2 h-5 w-5" /> {error}</div>
            </CardContent>
        </Card>
    );
  }
  
  if (!isLoading && suggestedProducts.length === 0) {
    return null; // Don't show the section if no suggestions and no error
  }

  return (
    <Card className="mt-8 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center"><Zap className="mr-2 h-5 w-5 text-accent" />{title}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Suggestions are based on your recent views and similar items. When history is limited, we use popular picks.</p>
      </CardHeader>
      <CardContent>
        <ProductGrid products={suggestedProducts} isLoading={isLoading} skeletonsCount={4} />
      </CardContent>
    </Card>
  );
}

export default ProductSuggestions;
