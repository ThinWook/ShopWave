"use client";

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

export interface RangeSliderProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'value' | 'defaultValue' | 'onValueChange'> {
  value: [number, number];
  onValueChange?: (value: [number, number]) => void;
  minStepsBetweenThumbs?: number; // optional constraint
}

/**
 * Two-thumb range slider built on Radix Slider.
 */
export const RangeSlider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, RangeSliderProps>(
  ({ className, value, onValueChange, minStepsBetweenThumbs = 0, min, max, step = 1, ...props }, ref) => {
    const clamp = React.useCallback((vals: [number, number]): [number, number] => {
      let [a, b] = vals;
      if (a > b) [a, b] = [b, a];
      if (typeof min === 'number') { a = Math.max(a, min); b = Math.max(b, min); }
      if (typeof max === 'number') { a = Math.min(a, max); b = Math.min(b, max); }
      if (minStepsBetweenThumbs > 0 && typeof step === 'number') {
        const minGap = minStepsBetweenThumbs * step;
        if (b - a < minGap) {
          // ưu tiên thumb đang kéo – ở đây không biết thumb nào, nên nới b
          b = Math.min(b + (minGap - (b - a)), (max as number) ?? b + minGap);
        }
      }
      return [a, b];
    }, [min, max, minStepsBetweenThumbs, step]);

    const handleChange = (vals: number[]) => {
      if (vals.length === 2 && onValueChange) onValueChange(clamp([vals[0], vals[1]]));
    };

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={handleChange}
        aria-label="Range selector"
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    );
  }
);
RangeSlider.displayName = 'RangeSlider';
