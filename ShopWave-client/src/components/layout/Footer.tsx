"use client";

import {
  Facebook,
  Instagram,
  Youtube,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 bg-primary text-white">
      {/* Top area */}
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand + contact + newsletter */}
        <div>
          <div className="text-2xl font-extrabold tracking-wide">
            ShopWave
          </div>
          <div className="mt-4 space-y-2 text-sm/6 text-white/80">
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-white/70" />
              <span>Tổng đài CSKH: 02873066060</span>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-white/70" />
              <a href="mailto:support@shopwave.com" className="hover:text-white">
                Email: support@shopwave.com
              </a>
            </p>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/90">
              Đăng ký nhận tin
            </h4>
            <p className="mt-1 text-xs text-white/70">
              Hãy là người đầu tiên nhận khuyến mãi lớn!
            </p>
            <form
              className="mt-3 flex w-full max-w-md items-center gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                placeholder="Nhập địa chỉ email"
                className="h-10 rounded-md border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/40"
              />
              <Button className="h-10 rounded-md bg-[#0d2e6f] px-4 hover:bg-[#123a86]">
                Đăng ký
              </Button>
            </form>
          </div>

          <div className="mt-6">
            <h4 className="sr-only">Mạng xã hội</h4>
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <Facebook className="size-5" />
              </a>
              <a
                href="#"
                aria-label="Zalo"
                className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <MessageCircle className="size-5" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <Youtube className="size-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Customer support links */}
        <div>
          <h4 className="text-base font-semibold uppercase tracking-wide text-white/90">
            Hỗ trợ khách hàng
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {[
              "Chính sách đổi hàng và bảo hành",
              "Chính sách Membership",
              "Chính sách ưu đãi sinh nhật",
              "Chính sách bảo mật",
              "Chính sách giao hàng",
            ].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-white">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Store addresses */}
        <div>
          <h4 className="text-base font-semibold uppercase tracking-wide text-white/90">
            Hệ thống cửa hàng
          </h4>
          <div className="mt-4 space-y-4 text-sm text-white/80">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-white/70" />
              <div>
                <p className="font-medium text-white/90">Hồ Chí Minh (12 CH)</p>
                <p>
                  Tầng 1 Aeon Mall, 1 Đường Số 17A, Bình Tân, Hồ Chí Minh
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-white/70" />
              <div>
                <p className="font-medium text-white/90">Hà Nội</p>
                <p>72 P. Chùa Bộc, Quang Trung, Đống Đa, Hà Nội</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-white/70" />
              <div>
                <p className="font-medium text-white/90">Đồng Nai</p>
                <p>
                  1357 Phạm Văn Thuận, P. Trung Dũng, Biên Hòa, Đồng Nai
                </p>
              </div>
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-medium text-white hover:underline"
            >
              Xem tất cả cửa hàng <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>

        {/* Fanpage + payment methods */}
        <div>
          <h4 className="text-base font-semibold uppercase tracking-wide text-white/90">
            Fanpage chúng tôi
          </h4>
          <div className="mt-4 rounded-lg bg-white/5 p-3">
            <div className="aspect-[16/9] w-full rounded-md bg-white/10" />
            <p className="mt-2 text-xs text-white/70">
              Xem video và cập nhật mới nhất từ ShopWave.
            </p>
          </div>

          <div className="mt-6">
            <h5 className="text-sm font-semibold text-white/90">
              Phương thức thanh toán
            </h5>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                VNPAY
              </Badge>
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                COD
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-8 w-24 rounded bg-white/10" />
            <div className="h-8 w-24 rounded bg-white/10" />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-4 md:mt-6">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-white/70">
          © {year} ShopWave. Bản quyền thuộc về ShopWave.
        </div>
      </div>
    </footer>
  );
}
