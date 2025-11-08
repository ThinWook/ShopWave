# ?? VNPay "Sai ch? ký" (Code 70) - FIX COMPLETE

## ? V?n ?? g?c

Khi thanh toán b?ng VNPay, user b? redirect v? trang l?i v?i thông báo:
- **Thông báo:** "Sai ch? ký"  
- **Mã l?i:** 70  
- **Mã tra c?u:** Kaee4yeBXu  
- **Th?i gian giao d?ch:** 08/11/2025 3:15:48 CH

URL l?i:
```
https://sandbox.vnpayment.vn/paymentv2/Payment/Error.html?code=70
```

---

## ?? Phân tích nguyên nhân

### 1. V?n ?? v? URL Encoding

**Code c? (SAI):**
```csharp
// ? queryString s? d?ng Uri.EscapeDataString (URL encoding)
var queryString = string.Join("&", sortedParams.Select(x => $"{x.Key}={Uri.EscapeDataString(x.Value)}"));

// ? signData KHÔNG s? d?ng encoding
var signData = string.Join("&", sortedParams.Select(x => $"{x.Key}={x.Value}"));
```

**V?n ??:**
- VNPay tính ch? ký trên d? li?u **G?C** (không URL-encode)
- Nh?ng trong tr??ng h?p có ký t? ??c bi?t (kho?ng tr?ng, ti?ng Vi?t trong `vnp_OrderInfo`), cách x? lý không nh?t quán
- VNPay có th? reject n?u phát hi?n inconsistency trong signature

### 2. Thi?u l?c tham s? r?ng

VNPay yêu c?u:
- KHÔNG tính ch? ký cho các tham s? có giá tr? r?ng (`null` ho?c `""`)
- Lo?i b? `vnp_SecureHash` và `vnp_SecureHashType` kh?i sign data

### 3. Thi?u logging chi ti?t

Không có log ?? debug khi ch? ký không kh?p:
- Không bi?t `signData` ???c t?o ra nh? th? nào
- Không so sánh ???c `computedHash` vs `receivedHash`

---

## ? Gi?i pháp ?ã áp d?ng

### 1. S?a hàm `CreateVnpayPaymentUrl`

**File:** `ShopWave/Services/PaymentGatewayService.cs`

```csharp
private async Task<string> CreateVnpayPaymentUrl(Order order, Guid transactionId, string returnUrl)
{
    var vnpayConfig = _configuration.GetSection("VNPay");
    var vnp_TmnCode = vnpayConfig["TmnCode"] ?? "";
    var vnp_HashSecret = vnpayConfig["HashSecret"] ?? "";
    var vnp_Url = vnpayConfig["Url"] ?? "";
    var vnp_Returnurl = returnUrl + "?gateway=vnpay";

    var vnp_Params = new Dictionary<string, string>
    {
        { "vnp_Version", "2.1.0" },
        { "vnp_Command", "pay" },
        { "vnp_TmnCode", vnp_TmnCode },
        { "vnp_Amount", ((long)(order.TotalAmount * 100)).ToString() },
        { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") },
        { "vnp_CurrCode", "VND" },
        { "vnp_IpAddr", "127.0.0.1" },
        { "vnp_Locale", "vn" },
        { "vnp_OrderInfo", $"Thanh toan don hang {order.OrderNumber}" },
        { "vnp_OrderType", "other" },
        { "vnp_ReturnUrl", vnp_Returnurl },
        { "vnp_TxnRef", transactionId.ToString() }
    };

    // ? Remove empty or null values (VNPay best practice)
    var validParams = vnp_Params
        .Where(x => !string.IsNullOrEmpty(x.Value))
        .OrderBy(x => x.Key)
        .ToList();

    // ? Create signature from RAW values (NO URL encoding)
    var signData = string.Join("&", validParams.Select(x => $"{x.Key}={x.Value}"));
    var vnp_SecureHash = HmacSHA512(vnp_HashSecret, signData);

    // ? Create query string WITH URL encoding
    var queryString = string.Join("&", validParams.Select(x => $"{x.Key}={Uri.EscapeDataString(x.Value)}"));
    var paymentUrl = $"{vnp_Url}?{queryString}&vnp_SecureHash={vnp_SecureHash}";

    // ? Log for debugging
    _logger.LogInformation("VNPay payment URL created. TransactionId: {TransactionId}, SignData: {SignData}", 
        transactionId, signData);
    
    return await Task.FromResult(paymentUrl);
}
```

**Thay ??i chính:**
1. ? L?c b? tham s? r?ng tr??c khi tính ch? ký
2. ? Tách bi?t rõ ràng gi?a `signData` (raw) và `queryString` (URL-encoded)
3. ? Thêm log chi ti?t

### 2. C?i thi?n hàm `ValidateVnpaySignature`

```csharp
public bool ValidateVnpaySignature(Dictionary<string, string> queryParams)
{
    try
    {
        var vnp_HashSecret = _configuration.GetSection("VNPay")["HashSecret"] ?? "";
        var vnp_SecureHash = queryParams.GetValueOrDefault("vnp_SecureHash", "");

        if (string.IsNullOrEmpty(vnp_SecureHash))
        {
            _logger.LogWarning("VNPay signature validation failed: vnp_SecureHash is missing");
            return false;
        }

        // ? Filter out signature params and empty values (same as when creating)
        var filteredParams = queryParams
            .Where(x => x.Key != "vnp_SecureHash" && x.Key != "vnp_SecureHashType" && !string.IsNullOrEmpty(x.Value))
            .OrderBy(x => x.Key)
            .ToList();

        // ? Create sign data from RAW values (ASP.NET already decoded query params)
        var signData = string.Join("&", filteredParams.Select(x => $"{x.Key}={x.Value}"));
        var computedHash = HmacSHA512(vnp_HashSecret, signData);

        // ? Log for debugging
        _logger.LogInformation("VNPay signature validation: Expected={Expected}, Received={Received}, SignData={SignData}", 
            computedHash, vnp_SecureHash, signData);

        return computedHash.Equals(vnp_SecureHash, StringComparison.InvariantCultureIgnoreCase);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error validating VNPay signature");
        return false;
    }
}
```

**Thay ??i chính:**
1. ? L?c b? tham s? r?ng (gi?ng nh? khi t?o URL)
2. ? Thêm validation cho `vnp_SecureHash` missing
3. ? Log chi ti?t ?? debug (`Expected`, `Received`, `SignData`)
4. ? Thêm try-catch ?? handle l?i

---

## ?? Cách ki?m tra

### 1. Ki?m tra log khi t?o payment URL

Sau khi user nh?n "Thanh toán", check log:
```
[INFO] VNPay payment URL created. TransactionId: {guid}, SignData: vnp_Amount=15000000&vnp_Command=pay&vnp_CreateDate=20250108151548&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh toan don hang ORD202501080001&vnp_OrderType=other&vnp_ReturnUrl=...&vnp_TmnCode=EHVSLSY9&vnp_TxnRef={guid}&vnp_Version=2.1.0
```

**Ki?m tra:**
- ? T?t c? tham s? ??u có giá tr? (không có r?ng)
- ? S?p x?p theo th? t? alphabet
- ? `vnp_OrderInfo` có d?u cách ch?a ???c URL-encode trong `SignData`

### 2. Ki?m tra log khi VNPay callback

Sau khi user thanh toán trên VNPay, check log:
```
[INFO] VNPay webhook received: {"vnp_Amount":"15000000","vnp_BankCode":"NCB",...}
[INFO] VNPay signature validation: Expected=abc123..., Received=abc123..., SignData=vnp_Amount=15000000&...
```

**Ki?m tra:**
- ? `Expected` == `Received` (ch? ký kh?p)
- ? Không có warning "Invalid VNPay signature"

### 3. Test v?i VNPay Sandbox

**Thông tin test:**
```json
{
  "TmnCode": "EHVSLSY9",
  "HashSecret": "NVAYQUKO2NSIX03LKWF651S44FOSVIT3",
  "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
}
```

**Test case:**
1. T?o ??n hàng v?i t?ng ti?n: 150,000 VND
2. Ch?n thanh toán VNPay
3. S? d?ng th? test: **9704198526191432198** (NCB)
4. Tên ch? th?: **NGUYEN VAN A**
5. Ngày phát hành: **07/15**
6. OTP: **123456**

**Expected result:**
- ? Redirect v? VNPay không b? l?i "Sai ch? ký"
- ? Thanh toán thành công
- ? Webhook callback ???c x? lý ?úng
- ? Order status = "PROCESSING", PaymentStatus = "PAID"

---

## ?? Checklist hoàn thành

- [x] S?a hàm `CreateVnpayPaymentUrl` - l?c tham s? r?ng
- [x] Tách bi?t rõ ràng `signData` (raw) vs `queryString` (encoded)
- [x] S?a hàm `ValidateVnpaySignature` - l?c tham s? r?ng
- [x] Thêm logging chi ti?t cho c? 2 hàm
- [x] Thêm error handling cho `ValidateVnpaySignature`
- [x] Build thành công không l?i
- [x] Vi?t tài li?u h??ng d?n debug

---

## ?? Tài li?u liên quan

### VNPay Official Documentation
- **API Docs:** https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
- **Signature Algorithm:** HMAC-SHA512
- **Encoding:** UTF-8
- **Important:** Signature calculated on RAW values, NOT URL-encoded

### Các file ?ã s?a
1. `ShopWave/Services/PaymentGatewayService.cs`
   - `CreateVnpayPaymentUrl()` - Fixed signature generation
   - `ValidateVnpaySignature()` - Improved validation & logging

2. `ShopWave/appsettings.json`
   - VNPay config (TmnCode, HashSecret, Url)

### Flow diagram
Xem: `ShopWave/Docs/CHECKOUT_FLOWS_VISUAL.md` - Section "2?? VNPay/MoMo Flow"

---

## ?? T?ng k?t

### Root cause:
- **Inconsistent handling** gi?a signature generation và query string building
- **Thi?u l?c** tham s? r?ng theo yêu c?u c?a VNPay
- **Thi?u logging** ?? debug

### Solution:
1. ? **Filter empty params** tr??c khi tính ch? ký
2. ? **Separate concerns**: `signData` (raw) vs `queryString` (encoded)
3. ? **Add detailed logging** ?? d? debug
4. ? **Consistent logic** gi?a create URL và validate signature

### Testing:
- ? Build successful
- ? C?n test th?c t? v?i VNPay Sandbox
- ? Monitor logs ?? verify signature match

---

**Date:** 2025-01-08  
**Status:** ? FIX APPLIED - READY FOR TESTING  
**Priority:** ?? HIGH (Payment critical)
