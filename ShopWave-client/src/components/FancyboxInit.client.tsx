"use client";

import { useEffect } from 'react';

export default function FancyboxInit() {
  useEffect(() => {
    // Try to bind Fancybox when available (CDN UMD exposes window.Fancybox)
    const tryBind = () => {
      const F = (window as any).Fancybox;
      if (F && typeof F.bind === 'function') {
        try {
          F.bind('[data-fancybox="gallery"]', {
            Thumbs: {
              autoStart: true,
            },
            Carousel: {
              preload: 2,
            },
            Toolbar: true,
            dragToClose: true,
            // show small close button and arrows inside
            closeButton: "top",
          });
        } catch (e) {
          // ignore
        }
      }
    };

    // If script already loaded, bind immediately
    tryBind();

    // Also attempt again on window load in case CDN script loads later
    window.addEventListener('load', tryBind);

    return () => {
      window.removeEventListener('load', tryBind);
      // Try to destroy if available
      try {
        const F = (window as any).Fancybox;
        if (F && typeof F.destroy === 'function') F.destroy();
      } catch {}
    };
  }, []);

  return null;
}
