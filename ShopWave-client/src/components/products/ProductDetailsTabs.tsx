"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  className?: string;
};

export default function ProductDetailsTabs({ product, className }: Props) {
  // attributes no longer used in quick-specs sidebar (removed)

  return (
    <section className={cn("w-full", className)} aria-label="Thông tin chi tiết sản phẩm">
      <div className="nav-tabs">{/* marker class per requirement */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="description">Mô tả</TabsTrigger>
            <TabsTrigger value="shipping">Chính sách Giao hàng</TabsTrigger>
            <TabsTrigger value="returns">Chính sách Đổi hàng</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="p-4 rounded-md bg-card border">
              <h3 className="text-lg font-semibold mb-3">{product.name}</h3>
              {renderDescription(product.description)}
            </div>
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <div className="p-4 rounded-md bg-card border">
              {(() => {
                // New asset location: public/Policy/Delivery/DeliveryPolicy.png
                const segments = ["Policy", "Delivery", "DeliveryPolicy.png"]; 
                const src = "/" + segments.map((s) => encodeURIComponent(s)).join("/");
                return (
                  <img
                    src={src}
                    alt="Chính sách Giao hàng"
                    className="w-full h-auto rounded-md"
                    loading="lazy"
                  />
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="returns" className="mt-6">
            <div className="p-4 rounded-md bg-card border">
              <div className="flex flex-col gap-4">
                {(() => {
                  // Render images from public/Return in order 1..5
                  const files = [
                    "return policy 1.jpg",
                    "return policy 2.jpg",
                    "return policy 3.jpg",
                    "return policy 4.jpg",
                    "return policy 5.jpg",
                  ];
                  return files.map((file, idx) => {
                    const src = "/" + ["Return", file].map(encodeURIComponent).join("/");
                    return (
                      <img
                        key={file}
                        src={src}
                        alt={`Chính sách Đổi hàng - Trang ${idx + 1}`}
                        className="w-full h-auto rounded-md"
                        loading="lazy"
                      />
                    );
                  });
                })()}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function renderDescription(text?: string) {
  if (!text) return <p className="text-sm text-muted-foreground">Mô tả sẽ được cập nhật.</p>;
  // Split by blank lines/newlines into paragraphs for better readability
  const parts = text.split(/\n\s*\n|\r\n\r\n|\n|\r/g).filter(Boolean);
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {parts.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
