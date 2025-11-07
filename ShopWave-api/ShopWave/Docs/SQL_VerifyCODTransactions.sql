-- ========================================
-- VERIFY COD TRANSACTIONS
-- Ki?m tra ??n hàng COD và Transaction logs
-- ========================================

USE [ShopWaveDb];
GO

PRINT '? COD TRANSACTION VERIFICATION';
PRINT '================================';
PRINT '';

-- 1. Ki?m tra COD Orders
PRINT '1?? COD Orders Summary:';
PRINT '----------------------';
SELECT 
    COUNT(*) as 'Total COD Orders',
    SUM(CASE WHEN Status = 'PROCESSING' THEN 1 ELSE 0 END) as 'Processing',
    SUM(CASE WHEN Status = 'SHIPPED' THEN 1 ELSE 0 END) as 'Shipped',
    SUM(CASE WHEN Status = 'DELIVERED' THEN 1 ELSE 0 END) as 'Delivered',
    SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) as 'Cancelled',
    SUM(CASE WHEN PaymentStatus = 'UNPAID' THEN 1 ELSE 0 END) as 'Unpaid',
    SUM(CASE WHEN PaymentStatus = 'PAID' THEN 1 ELSE 0 END) as 'Paid',
    SUM(TotalAmount) as 'Total Revenue'
FROM Orders
WHERE PaymentMethod = 'COD';
PRINT '';

-- 2. Ki?m tra COD Transactions
PRINT '2?? COD Transactions:';
PRINT '--------------------';
SELECT 
    COUNT(*) as 'Total COD Transactions',
    SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as 'Pending (Ch?a thu ti?n)',
    SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) as 'Success (?ã thu ti?n)',
    SUM(CASE WHEN Status = 'FAILED' THEN 1 ELSE 0 END) as 'Failed'
FROM Transactions
WHERE Gateway = 'COD';
PRINT '';

-- 3. Chi ti?t ??n hàng COD g?n nh?t
PRINT '3?? Recent COD Orders (Top 10):';
PRINT '-------------------------------';
SELECT TOP 10
    o.OrderNumber,
    o.ShippingFullName as 'Customer',
    o.TotalAmount,
    o.Status as 'Order Status',
    o.PaymentStatus,
    t.Status as 'Transaction Status',
    FORMAT(o.OrderDate, 'dd/MM/yyyy HH:mm') as 'Order Date',
    CASE 
        WHEN t.CompletedAt IS NOT NULL THEN FORMAT(t.CompletedAt, 'dd/MM/yyyy HH:mm')
        ELSE 'Ch?a thu ti?n'
    END as 'Payment Collected'
FROM Orders o
LEFT JOIN Transactions t ON o.Id = t.OrderId
WHERE o.PaymentMethod = 'COD'
ORDER BY o.OrderDate DESC;
PRINT '';

-- 4. Ki?m tra Orders không có Transaction log
PRINT '4?? Orders without Transaction Log (BUG):';
PRINT '-----------------------------------------';
DECLARE @missingTransactions INT;
SELECT @missingTransactions = COUNT(*)
FROM Orders o
LEFT JOIN Transactions t ON o.Id = t.OrderId
WHERE o.PaymentMethod = 'COD' AND t.Id IS NULL;

IF @missingTransactions > 0
BEGIN
    PRINT CONCAT('?? WARNING: ', @missingTransactions, ' COD orders found without transaction log!');
    PRINT '';
    SELECT 
        o.OrderNumber,
        o.ShippingFullName,
        o.TotalAmount,
        FORMAT(o.OrderDate, 'dd/MM/yyyy HH:mm') as 'Order Date'
    FROM Orders o
    LEFT JOIN Transactions t ON o.Id = t.OrderId
    WHERE o.PaymentMethod = 'COD' AND t.Id IS NULL;
END
ELSE
BEGIN
    PRINT '? All COD orders have transaction logs';
END
PRINT '';

-- 5. Ki?m tra Orders v?i status không h?p l?
PRINT '5?? Orders with Invalid Status:';
PRINT '--------------------------------';
DECLARE @invalidStatus INT;
SELECT @invalidStatus = COUNT(*)
FROM Orders
WHERE PaymentMethod = 'COD' 
  AND Status = 'PENDING_PAYMENT'; -- COD should never be PENDING_PAYMENT

IF @invalidStatus > 0
BEGIN
    PRINT CONCAT('? ERROR: ', @invalidStatus, ' COD orders found with PENDING_PAYMENT status!');
    PRINT '';
    SELECT 
        OrderNumber,
        Status,
        PaymentStatus,
        FORMAT(OrderDate, 'dd/MM/yyyy HH:mm') as 'Order Date'
    FROM Orders
    WHERE PaymentMethod = 'COD' AND Status = 'PENDING_PAYMENT';
END
ELSE
BEGIN
    PRINT '? All COD orders have correct status (PROCESSING or later)';
END
PRINT '';

-- 6. Revenue Summary
PRINT '6?? COD Revenue Summary:';
PRINT '------------------------';
SELECT 
    'T?ng doanh thu COD' as 'Metric',
    FORMAT(SUM(TotalAmount), 'N0') + ' VND' as 'Value'
FROM Orders
WHERE PaymentMethod = 'COD'
UNION ALL
SELECT 
    '?ã thu ti?n',
    FORMAT(SUM(o.TotalAmount), 'N0') + ' VND'
FROM Orders o
INNER JOIN Transactions t ON o.Id = t.OrderId
WHERE o.PaymentMethod = 'COD' AND t.Status = 'SUCCESS'
UNION ALL
SELECT 
    'Ch?a thu ti?n',
    FORMAT(SUM(o.TotalAmount), 'N0') + ' VND'
FROM Orders o
INNER JOIN Transactions t ON o.Id = t.OrderId
WHERE o.PaymentMethod = 'COD' AND t.Status = 'PENDING';
PRINT '';

-- 7. Sample data ?? ki?m tra chi ti?t
PRINT '7?? Sample COD Order Detail:';
PRINT '----------------------------';
DECLARE @sampleOrderId UNIQUEIDENTIFIER;
SELECT TOP 1 @sampleOrderId = Id 
FROM Orders 
WHERE PaymentMethod = 'COD' 
ORDER BY OrderDate DESC;

IF @sampleOrderId IS NOT NULL
BEGIN
    SELECT 
        'Order' as 'Type',
        o.OrderNumber as 'Reference',
        o.Status,
        o.PaymentStatus,
        o.TotalAmount,
        FORMAT(o.OrderDate, 'dd/MM/yyyy HH:mm') as 'Date'
    FROM Orders o
    WHERE o.Id = @sampleOrderId
    UNION ALL
    SELECT 
        'Transaction',
        t.Gateway,
        t.Status,
        t.TransactionType,
        t.Amount,
        FORMAT(t.CreatedAt, 'dd/MM/yyyy HH:mm')
    FROM Transactions t
    WHERE t.OrderId = @sampleOrderId;
    
    PRINT '';
    PRINT 'Order Items:';
    SELECT 
        oi.ProductName,
        oi.Quantity,
        oi.UnitPrice,
        oi.TotalPrice
    FROM OrderItems oi
    WHERE oi.OrderId = @sampleOrderId;
END
ELSE
BEGIN
    PRINT 'No COD orders found in database';
END
PRINT '';

PRINT '================================';
PRINT '? VERIFICATION COMPLETE';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Create a test COD order via POST /api/v1/checkout';
PRINT '2. Verify Transaction log is created with Gateway=COD';
PRINT '3. Check Cart is deleted after order creation';
PRINT '4. Test Admin updating Transaction.Status to SUCCESS';
