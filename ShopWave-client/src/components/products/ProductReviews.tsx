
"use client";

import type { Review } from '@/lib/types';
import { StarRating } from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown } from 'lucide-react'; // User icon can be generic

interface ProductReviewsProps {
  reviews: Review[];
  productId: string;
}

export function ProductReviews({ reviews, productId }: ProductReviewsProps) {
  if (reviews.length === 0) {
    return (
      <Card className="mt-8 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Product Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No reviews yet for this product. Be the first to write one!</p>
          {/* TODO: Add a "Write a Review" button/form */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="pb-6 border-b last:border-b-0">
            <div className="flex items-start space-x-3">
              <Avatar>
                <AvatarImage src={`https://placehold.co/40x40.png?text=${review.userName.charAt(0)}`} alt={review.userName} data-ai-hint="avatar person" />
                <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-md">{review.userName}</h4>
                    <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                </div>
                <StarRating rating={review.rating} size={16} className="mb-1" />
                <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                <div className="mt-3 flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Was this review helpful?</span>
                  <button className="flex items-center hover:text-primary transition-colors"><ThumbsUp className="h-4 w-4 mr-1" /> Yes</button>
                  <button className="flex items-center hover:text-primary transition-colors"><ThumbsDown className="h-4 w-4 mr-1" /> No</button>
                </div>
              </div>
            </div>
          </div>
        ))}
         {/* TODO: Add pagination or "Load More" for reviews */}
      </CardContent>
    </Card>
  );
}

export default ProductReviews;
