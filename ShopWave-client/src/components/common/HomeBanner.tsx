"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Home page hero banner
 * Image file expected at /public/banner/ocean-threads.jpg (or .png)
 * You can replace src with your actual filename.
 */
export default function HomeBanner() {
  const defaultSrc = "/banner/ocean-threads.png"; // place your image under public/banner/
  const [imgSrc, setImgSrc] = useState(defaultSrc);
  return (
    <section className="relative w-full overflow-hidden rounded-xl border bg-gradient-to-r from-sky-50 to-amber-50 dark:from-slate-900 dark:to-slate-800">
      {/* Image */}
  <div className="relative h-[220px] sm:h-[300px] md:h-[700px]">
        {/* Base gradient is kept so it still looks ok if the image is missing */}
        <Image
          src={imgSrc}
          alt="Ocean Threads - Beachwear & Accessories"
          // Avoid using the server-side image optimizer in dev (self-signed backend certs,
          // turbopack limitations). Let the browser fetch the asset directly.
          unoptimized
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
          onError={() => {
            if (imgSrc !== "/placeholder.png") {
              // Fall back to placeholder if the banner image is missing
              setImgSrc("/placeholder.png");
            }
          }}
        />
      </div>
      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-end p-6 sm:p-10">
        <div className="w-full max-w-md rounded-lg bg-background/80 p-6 backdrop-blur-md shadow-sm">
          <p className="text-sm tracking-widest text-muted-foreground uppercase">Beachwear & Accessories</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold leading-tight">Ocean Threads</h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            New-season essentials for your seaside escape.
          </p>
          <div className="mt-5">
            <Link href="/products">
              <Button size="lg">Shop Now</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
