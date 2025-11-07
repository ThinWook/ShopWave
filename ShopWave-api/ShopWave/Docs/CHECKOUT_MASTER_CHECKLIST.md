# ? CHECKOUT SYSTEM - MASTER CHECKLIST

## ?? Implementation Status

### Backend Code
- [x] `CheckoutController.cs` - Main checkout logic
- [x] `PaymentWebhookController.cs` - Webhook handling
- [x] `IPaymentGatewayService.cs` - Service interface
- [x] `PaymentGatewayService.cs` - Service implementation
- [x] `appsettings.json` - Configuration
- [x] `Program.cs` - Service registration

### COD Flow
- [x] Get cart with items and discounts
- [x] Stock validation (final check)
- [x] Price calculation (subtotal + shipping - voucher)
- [x] Order creation (Status: PROCESSING)
- [x] OrderItems with snapshot (ProductName, UnitPrice)
- [x] Transaction log creation (Gateway: COD, Status: PENDING)
- [x] Stock reduction (immediate)
- [x] Cart deletion (complete: Cart + CartItems + AppliedDiscounts)
- [x] Email placeholder (TODO: implement service)
- [x] 201 Created response

### VNPay Flow
- [x] Get cart and validate
- [x] Order creation (Status: PENDING_PAYMENT)
- [x] Transaction creation (Status: PENDING)
- [x] Payment URL generation (HMAC-SHA512 signature)
- [x] Stock NOT reduced (deferred)
- [x] Cart NOT deleted (deferred)
- [x] Webhook signature validation
- [x] Webhook idempotency check
- [x] Stock reduction on success webhook
- [x] Cart deletion on success webhook
- [x] Order status update (PROCESSING)
- [x] Transaction status update (SUCCESS)
- [x] Return URL handling

### MoMo Flow
- [x] Get cart and validate
- [x] Order creation (Status: PENDING_PAYMENT)
- [x] Transaction creation (Status: PENDING)
- [x] Payment URL generation (HMAC-SHA256 signature)
- [x] HTTP POST request to MoMo endpoint
- [x] Stock NOT reduced (deferred)
- [x] Cart NOT deleted (deferred)
- [x] Webhook signature validation
- [x] Webhook idempotency check
- [x] Stock reduction on success webhook
- [x] Cart deletion on success webhook
- [x] Order status update (PROCESSING)
- [x] Transaction status update (SUCCESS)
- [x] Return URL handling

### Database
- [x] Orders table (with shipping/billing fields)
- [x] OrderItems table (with snapshot fields)
- [x] Transactions table (with gateway info)
- [x] Cart cleanup logic
- [x] Stock reduction logic
- [x] Foreign key relationships

### Documentation
- [x] CHECKOUT_PAYMENT_GUIDE.md - Complete guide
- [x] COD_IMPLEMENTATION_SUMMARY.md - COD details
- [x] COD_TESTING_CHECKLIST.md - COD test cases
- [x] CHECKOUT_QUICK_START.md - Quick setup
- [x] COD_QUICK_REF.md - Quick reference
- [x] SQL_VerifyCODTransactions.sql - Verification script
- [x] CHECKOUT_PAYMENT_COMPLETE.md - Overall summary
- [x] COD_FLOW_COMPLETE.md - COD completion report
- [x] CHECKOUT_FINAL_SUMMARY.md - Final summary
- [x] CHECKOUT_FLOWS_VISUAL.md - Visual diagrams
- [x] This checklist

---

## ?? Testing Checklist

### COD Tests
- [ ] Happy path (create order, check DB, verify cart deleted)
- [ ] Out of stock (should return 400 Bad Request)
- [ ] Empty cart (should return 400 Bad Request)
- [ ] Transaction log created (Gateway: COD)
- [ ] Stock reduced immediately
- [ ] Cart deleted completely (Cart + CartItems + AppliedDiscounts)
- [ ] 201 Created status code
- [ ] Email log present

### VNPay Tests
- [ ] Create payment URL (should return 200 OK with URL)
- [ ] Order status (should be PENDING_PAYMENT)
- [ ] Transaction status (should be PENDING)
- [ ] Stock NOT reduced yet
- [ ] Cart NOT deleted yet
- [ ] Signature validation (test with invalid signature)
- [ ] Test card payment (NCB 9704198526191432198)
- [ ] Webhook called (check logs)
- [ ] Webhook signature validation
- [ ] Webhook idempotency (call twice, should handle)
- [ ] Stock reduced after webhook success
- [ ] Cart deleted after webhook success
- [ ] Order status updated (PROCESSING)
- [ ] Transaction status updated (SUCCESS)
- [ ] Return URL redirect

### MoMo Tests
- [ ] Create payment URL (should return 200 OK with URL)
- [ ] HTTP POST to MoMo endpoint
- [ ] Order status (should be PENDING_PAYMENT)
- [ ] Transaction status (should be PENDING)
- [ ] Stock NOT reduced yet
- [ ] Cart NOT deleted yet
- [ ] Signature validation (test with invalid signature)
- [ ] Test payment on MoMo sandbox
- [ ] Webhook called (check logs)
- [ ] Webhook signature validation
- [ ] Webhook idempotency
- [ ] Stock reduced after webhook success
- [ ] Cart deleted after webhook success
- [ ] Order status updated (PROCESSING)
- [ ] Transaction status updated (SUCCESS)
- [ ] Return URL redirect

### Error Scenarios
- [ ] Payment timeout (VNPay/MoMo)
- [ ] Payment failed (VNPay/MoMo)
- [ ] Webhook timeout
- [ ] Race condition (Return URL before Webhook)
- [ ] Duplicate webhook calls
- [ ] Invalid signature
- [ ] Network errors

### Database Verification
- [ ] Run SQL_VerifyCODTransactions.sql
- [ ] Check Orders table structure
- [ ] Check Transactions table structure
- [ ] Check OrderItems snapshot fields
- [ ] Check foreign keys
- [ ] Check indexes

---

## ?? Configuration Checklist

### Development
- [x] appsettings.json with VNPay/MoMo sandbox config
- [ ] User Secrets for sensitive data (recommended)
- [ ] Test credentials from VNPay/MoMo sandbox

### Staging
- [ ] Register VNPay sandbox account
- [ ] Register MoMo sandbox account
- [ ] Get TmnCode, HashSecret (VNPay)
- [ ] Get PartnerCode, AccessKey, SecretKey (MoMo)
- [ ] Update appsettings.Staging.json
- [ ] Setup ngrok for webhook testing
- [ ] Update IpnUrl with ngrok URL
- [ ] Configure merchant settings on VNPay/MoMo portals

### Production
- [ ] Apply for VNPay production account
- [ ] Apply for MoMo production account
- [ ] Get production credentials
- [ ] Update appsettings.Production.json
- [ ] Use Azure Key Vault / AWS Secrets Manager
- [ ] Configure production domain for IpnUrl
- [ ] SSL certificate for webhooks
- [ ] Firewall whitelist for VNPay/MoMo IPs
- [ ] Setup monitoring and alerts

---

## ?? Deployment Checklist

### Pre-deployment
- [ ] Code review complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Database migration ready
- [ ] Configuration reviewed
- [ ] Security audit passed

### Deployment
- [ ] Backup database
- [ ] Run database migrations
- [ ] Deploy backend code
- [ ] Verify configuration loaded
- [ ] Smoke test all endpoints
- [ ] Check logs for errors

### Post-deployment
- [ ] Test COD flow end-to-end
- [ ] Test VNPay flow end-to-end
- [ ] Test MoMo flow end-to-end
- [ ] Monitor logs for 24 hours
- [ ] Check error rates
- [ ] Verify webhook callbacks working
- [ ] Load testing

---

## ?? Monitoring Checklist

### Metrics to Track
- [ ] Order creation rate (orders/hour)
- [ ] Payment success rate (%)
- [ ] Payment failure rate (%)
- [ ] Webhook latency (seconds)
- [ ] API response time (milliseconds)
- [ ] Error rate (%)
- [ ] COD vs Online payment ratio

### Alerts to Setup
- [ ] Payment failure rate > 5%
- [ ] Webhook timeout > 60s
- [ ] API error rate > 1%
- [ ] Order creation failures
- [ ] Stock inconsistencies
- [ ] Cart cleanup failures

### Logs to Monitor
- [ ] Order creation logs
- [ ] Payment webhook logs
- [ ] Error logs
- [ ] Transaction logs
- [ ] Stock reduction logs
- [ ] Cart deletion logs

---

## ?? Known Issues / TODO

### High Priority
- [ ] Implement Email Service (SendGrid/AWS SES)
- [ ] Add Admin API for payment confirmation
- [ ] Add order status polling endpoint for frontend

### Medium Priority
- [ ] Add retry mechanism for webhook failures
- [ ] Add circuit breaker for payment gateways
- [ ] Add rate limiting on checkout endpoint
- [ ] Add order cancellation API
- [ ] Add refund API

### Low Priority
- [ ] Add payment method preferences (user settings)
- [ ] Add installment support (VNPay)
- [ ] Add QR code payment (MoMo)
- [ ] Add payment history dashboard
- [ ] Add analytics dashboard

---

## ?? Support Contacts

### Payment Gateways
- **VNPay Support:** support@vnpay.vn
- **VNPay Docs:** https://sandbox.vnpayment.vn/apis/
- **MoMo Support:** developer@momo.vn
- **MoMo Docs:** https://developers.momo.vn/

### Internal
- **Backend Lead:** [Your Name]
- **DevOps:** [DevOps Contact]
- **QA Lead:** [QA Contact]

---

## ?? Sign-off

### Development Team
- [ ] Backend Developer - Code complete
- [ ] QA Engineer - Tests passed
- [ ] DevOps - Infrastructure ready

### Stakeholders
- [ ] Product Owner - Features approved
- [ ] Tech Lead - Architecture reviewed
- [ ] Security Team - Security audit passed

---

## ?? Success Criteria

### Functional
- [x] COD orders can be created
- [x] VNPay payments can be processed
- [x] MoMo payments can be processed
- [x] Orders are tracked correctly
- [x] Stock is managed correctly
- [x] Carts are cleaned up

### Non-functional
- [ ] API response time < 500ms (COD)
- [ ] API response time < 2s (VNPay/MoMo URL generation)
- [ ] Payment success rate > 95%
- [ ] Webhook processing time < 3s
- [ ] Zero stock inconsistencies
- [ ] 99.9% uptime

---

## ?? Reference Documents

| Document | URL | Purpose |
|----------|-----|---------|
| Main Guide | [CHECKOUT_PAYMENT_GUIDE.md](./CHECKOUT_PAYMENT_GUIDE.md) | Complete implementation |
| COD Summary | [COD_IMPLEMENTATION_SUMMARY.md](./COD_IMPLEMENTATION_SUMMARY.md) | COD details |
| COD Tests | [COD_TESTING_CHECKLIST.md](./COD_TESTING_CHECKLIST.md) | Test cases |
| Quick Start | [CHECKOUT_QUICK_START.md](./CHECKOUT_QUICK_START.md) | Quick setup |
| Visual Flows | [CHECKOUT_FLOWS_VISUAL.md](./CHECKOUT_FLOWS_VISUAL.md) | Diagrams |
| Final Summary | [CHECKOUT_FINAL_SUMMARY.md](./CHECKOUT_FINAL_SUMMARY.md) | Overview |

---

**Status:** ? Implementation Complete | ?? Testing Pending  
**Last Updated:** 2025-01-15  
**Version:** 1.0  
**Next Review:** Before Production Deployment
