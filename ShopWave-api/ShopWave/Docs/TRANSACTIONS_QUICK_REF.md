# ?? Transactions Table - Quick Reference

## Table Structure

```sql
Transactions
??? Id (PK, Guid)
??? OrderId (FK ? Orders.Id)
??? Gateway (VNPAY, MOMO, COD, etc.)
??? GatewayTransactionId
??? Amount (decimal 18,2)
??? Status (PENDING, SUCCESS, FAILED, REFUNDED, CANCELLED)
??? TransactionType (PAYMENT, REFUND, CHARGEBACK)
??? ErrorMessage
??? GatewayResponse (JSON)
??? IpAddress
??? UserAgent
??? CreatedAt
??? UpdatedAt
??? CompletedAt
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/transactions` | Create transaction | Required |
| GET | `/api/v1/transactions/order/{orderId}` | Get order transactions | Required |
| GET | `/api/v1/transactions/{id}` | Get transaction details | Required |
| PUT | `/api/v1/transactions/{id}/status` | Update status | Required |
| GET | `/api/v1/transactions/vnpay/callback` | VNPay webhook | Public |
| POST | `/api/v1/transactions/momo/callback` | MoMo webhook | Public |

## Status Flow

```
PENDING ? PROCESSING ? SUCCESS ?
                      ? FAILED ?
                      ? CANCELLED
SUCCESS ? REFUNDED ??
```

## Common Queries

### Get All Transactions for an Order
```sql
SELECT * FROM Transactions 
WHERE OrderId = '<guid>' 
ORDER BY CreatedAt DESC;
```

### Today's Revenue by Gateway
```sql
SELECT Gateway, SUM(Amount) as Revenue
FROM Transactions
WHERE Status = 'SUCCESS' 
  AND CAST(CreatedAt AS DATE) = CAST(GETUTCDATE() AS DATE)
GROUP BY Gateway;
```

### Failed Payments Last 24h
```sql
SELECT COUNT(*), Gateway, ErrorMessage
FROM Transactions
WHERE Status = 'FAILED' 
  AND CreatedAt > DATEADD(HOUR, -24, GETUTCDATE())
GROUP BY Gateway, ErrorMessage;
```

### Success Rate by Gateway
```sql
SELECT Gateway,
    COUNT(*) as Total,
    SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) as Successful,
    CAST(SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as SuccessRate
FROM Transactions
GROUP BY Gateway;
```

## Payment Gateway Codes

### VNPay Response Codes
- `00` = Success
- `07` = Suspicious transaction
- `09` = Card not registered for internet banking
- `10` = Wrong authentication
- `11` = Timeout
- `24` = Cancelled
- `51` = Insufficient funds
- `65` = Transaction limit exceeded

### MoMo Result Codes
- `0` = Success
- `9000` = Transaction confirmed
- `1001` = Transaction failed
- `1002` = Transaction cancelled
- `1003` = Timeout
- `1004` = Declined
- `1005` = Insufficient funds

## Testing

### Create Test Transaction
```bash
curl -X POST http://localhost:5001/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "gateway": "VNPAY",
    "amount": 1500000,
    "transactionType": "PAYMENT"
  }'
```

### Simulate VNPay Callback
```bash
curl "http://localhost:5001/api/v1/transactions/vnpay/callback?vnp_TxnRef=ORD20250115001&vnp_TransactionNo=VNP12345&vnp_ResponseCode=00&vnp_Amount=150000000"
```

## Constants

### Transaction Status
```csharp
TransactionStatus.Pending      // "PENDING"
TransactionStatus.Processing   // "PROCESSING"
TransactionStatus.Success      // "SUCCESS"
TransactionStatus.Failed       // "FAILED"
TransactionStatus.Refunded     // "REFUNDED"
TransactionStatus.Cancelled    // "CANCELLED"
```

### Transaction Type
```csharp
TransactionType.Payment        // "PAYMENT"
TransactionType.Refund         // "REFUND"
TransactionType.Chargeback     // "CHARGEBACK"
TransactionType.Adjustment     // "ADJUSTMENT"
```

### Payment Gateway
```csharp
PaymentGateway.VNPay          // "VNPAY"
PaymentGateway.MoMo           // "MOMO"
PaymentGateway.COD            // "COD"
PaymentGateway.Stripe         // "STRIPE"
PaymentGateway.PayPal         // "PAYPAL"
PaymentGateway.BankTransfer   // "BANK_TRANSFER"
```

## Indexes

```sql
-- Primary Key
PK_Transactions ON (Id)

-- Foreign Key
FK_Transactions_Orders ON (OrderId) ? Orders(Id)

-- Performance Indexes
IX_Transactions_GatewayTransactionId ON (GatewayTransactionId)
IX_Transactions_OrderId_Status ON (OrderId, Status)
```

## Files

```
ShopWave/
??? Models/
?   ??? Transaction.cs             ? Model
?   ??? Order.cs                   ? Updated (Transactions nav)
??? DTOs/Transaction/
?   ??? TransactionDtos.cs         ? DTOs
??? Controllers/
?   ??? TransactionsController.cs  ? API endpoints
??? Docs/
    ??? TRANSACTIONS_TABLE_GUIDE.md    ? Full guide
    ??? TRANSACTIONS_COMPLETE.md       ? Summary
    ??? SQL_VerifyTransactions.sql     ? Verification
```

## Security Checklist

- [ ] Verify VNPay signatures in production
- [ ] Verify MoMo signatures in production
- [ ] Implement IP whitelisting for webhooks
- [ ] Use HTTPS for all API calls
- [ ] Store gateway credentials securely (Azure Key Vault, etc.)
- [ ] Log all transaction attempts
- [ ] Monitor for suspicious patterns
- [ ] Set up alerts for failed transactions

## Monitoring

### Key Metrics
- Transaction success rate (target: >95%)
- Average processing time
- Failed transaction rate
- Gateway availability
- Refund rate
- Chargeback rate

### Alerts
- Failed transaction rate > 10%
- Transactions stuck in PENDING > 1 hour
- Webhook endpoint failures
- Unusual refund patterns

---

**Quick Start:**
1. Create migration: `dotnet ef migrations add AddTransactionsTable`
2. Apply: `dotnet ef database update`
3. Verify: Run `SQL_VerifyTransactions.sql`
4. Test: Create transaction via API
5. Integrate: Set up payment gateway webhooks
