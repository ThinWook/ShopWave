# ShopWave Ecommerce - Next.js + SQL Server

Dự án này là một starter Next.js cho ứng dụng ecommerce (ShopWave) sử dụng SQL Server làm cơ sở dữ liệu.

## Bắt đầu

1. Cài đặt dependencies:

```bash
npm install
```

2. Tạo CSDL trong SQL Server bằng script:

- `database-schema-sqlserver.sql` hoặc `database-schema-sqlserver-perfect.sql` (khuyến nghị)

3. Cấu hình biến môi trường (`.env.local`):

```
# Kết nối SQL Server (ví dụ dùng mssql)
DATABASE_URL=mssql://USER:PASSWORD@localhost:1433/ShopWaveDB?encrypt=false
```

4. Chạy development server:

```bash
npm run dev
```

## Ghi chú

- Firebase đã được loại bỏ khỏi dự án.
- Nếu bạn dùng Nix, `dev.nix` đã không còn cấu hình Firebase emulators.
- Các sơ đồ CSDL và Use Case nằm trong các file `.md` trong thư mục gốc.

## Tích hợp Backend API

Ứng dụng đã được chuyển sang gọi các API backend (ASP.NET / bất kỳ backend nào tuân theo spec) với base URL:

```
Dev HTTPS: https://localhost:5001
Dev HTTP : http://localhost:5000
```

Tạo file `.env.local` (hoặc cập nhật) để cấu hình:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Format response backend kỳ vọng:

```json
{ "success": true, "message": "string", "data": {}, "errors": [] }
```

Header Authorization cho endpoint yêu cầu đăng nhập:

```
Authorization: Bearer <token>
```

Sau khi user đăng nhập (chưa implement tại front-end ở repo này), lưu token vào `localStorage` với key `authToken` để các context (cart, wishlist) tự động gửi kèm.

### Các module đã tích hợp

- `src/lib/api.ts`: API client + mapper DTO -> model.
- `ProductContext`: tải danh sách sản phẩm qua `/api/products` (paged) và cung cấp filter/sort phía client.
- `CartContext`: đồng bộ giỏ hàng qua các endpoint `/api/cart`, `/api/cart/add`, ...
- `WishlistContext`: đồng bộ wishlist qua `/api/wishlist` ...
- Trang chi tiết sản phẩm `/product/[id]` gọi trực tiếp `/api/products/{id}` và `/api/products/{id}/reviews`.

### Thay đổi model

Các interface `Product`, `CartItem`, `WishlistItem`, `Review` trước đây ở `lib/types.ts` đã được di chuyển sang `api.ts` (với prefix FE...). File `types.ts` chỉ còn re-export để tránh lỗi import cũ.

### Mở rộng / TODO

- Thêm cơ chế đăng nhập lấy token và refresh token.
- Thêm react-query để cache + retry network.
- Mapping nâng cao cho thuộc tính `popularity` nếu backend cung cấp (hiện dùng `reviewsCount`).
- Xử lý lỗi UI friendly hơn (toast / error boundary).

## Tính năng giỏ hàng: Giảm giá bậc & Voucher

Frontend đã hỗ trợ đầy đủ UI/UX cho chương trình khuyến mãi theo bậc (progressive discount) và mã giảm giá (voucher).

Thư mục liên quan:

- UI:
  - `src/components/cart/DiscountProgressBar.tsx` — Thanh tiến trình “Mua thêm X để được giảm Y”.
  - `src/components/cart/CartItemCard.tsx` — Hiển thị biến thể rõ ràng (mỗi option một dòng), Đơn giá và Tổng theo VND.
  - `src/components/cart/CartSummary.tsx` — Ô nhập voucher, danh sách voucher có sẵn, breakdown giá (Tạm tính, Giảm giá bậc, Voucher, Phí vận chuyển, Tổng cộng).
  - `src/app/cart/page.tsx` — Render thanh tiến trình ở cột trái.
- State/API:
  - `src/contexts/CartContext.tsx` — Lưu và chuẩn hóa dữ liệu `progressiveDiscount`, `appliedVoucher`, `availableVouchers`.
  - `src/lib/api.ts` — Thêm DTO/endpoint cho voucher: `applyVoucher`, `removeVoucher`.
  - `src/lib/types.ts` — Khai báo type `ProgressiveDiscount`, `AppliedVoucher`, `AvailableVoucher`.

Kỳ vọng từ backend khi trả về giỏ hàng (có thể là trong `data` hoặc top-level):

```jsonc
{
  "items": [ /* ... */ ],
  "totalItems": 3,
  "subTotal": 500000,
  "shippingFee": 0,
  "total": 430000,
  "progressive_discount": {
    "next_threshold_remaining": 121000,
    "next_discount_value": 70000,
    "current_discount_value": 0,
    "progress_percent": 75
  },
  "applied_voucher": {
    "code": "NOV40",
    "discount_amount": 70000,
    "description": "Giảm 40k cho đơn từ 300k"
  },
  "available_vouchers": [
    { "code": "NOV15", "description": "Giảm 15k" },
    { "code": "NOV40", "description": "Giảm 40k cho đơn từ 300k" }
  ]
}
```

Endpoint voucher (mặc định kèm header `X-Session-Id` để hỗ trợ giỏ hàng khách):

- Áp dụng voucher: `POST /api/v1/cart/voucher` body `{ code: string }`
- Gỡ voucher: `DELETE /api/v1/cart/voucher`

Lưu ý:

- UI tự ẩn/hiện các phần giảm giá khi backend chưa cung cấp các trường trên.
- Tiền tệ hiển thị bằng `formatPrice` (VND, `vi-VN`).
- Tất cả hành vi lỗi trong `CartContext` đi kèm toast thân thiện và traceId (nếu backend trả về) để hỗ trợ debug.

## HTTP/2 local development

This project includes a small HTTP/2 TLS reverse-proxy that terminates TLS (required for browser HTTP/2) and proxies traffic to the local Next.js server.

- Dev script (auto-generates a self-signed cert):

  - `npm run dev:h2` — starts `next dev` on port 3000 and the HTTP/2 proxy on port 3443. Open https://localhost:3443 to connect with HTTP/2.

- Start (production-like) script:

  - `npm run start:h2` — starts `next start` on port 3000 and the HTTP/2 proxy on port 3443. By default this generates a self-signed cert; pass `--no-selfsigned` to the proxy and provide your own cert/key when running in a real environment.

Where the proxy lives: `server/h2.js`.

How it works:

- The proxy will generate `server/certs/dev-cert.pem` and `server/certs/dev-key.pem` if missing using the `selfsigned` package.
- Browsers will distrust the certificate by default. On Windows you can trust it for development by importing the `dev-cert.pem` into the Trusted Root Certification Authorities store.

Trust self-signed cert on Windows (PowerShell):

```powershell
# Run from project root (PowerShell as Administrator recommended)
# 1) Generate the cert by starting the proxy (or run the dev:h2 script briefly):
npm run dev:h2
# 2) Import the generated cert (adjust path if needed):
$certPath = "$PSScriptRoot\\server\\certs\\dev-cert.pem"
Import-Certificate -FilePath $certPath -CertStoreLocation Cert:\LocalMachine\Root
```

If you prefer not to trust a self-signed certificate, generate or provide a proper TLS certificate and pass `--cert <path>` and `--key <path>` to the proxy (see `server/h2.js` for CLI flags).

Note: Modern browsers require HTTPS for HTTP/2 and will refuse insecure upgrades; this proxy is meant for local development and testing only.
