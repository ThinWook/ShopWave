-- ========================================
-- TRANSACTIONS TABLE - Setup & Verification
-- ========================================

USE [ShopWaveDb];
GO

PRINT '========================================';
PRINT 'Transactions Table Setup';
PRINT '========================================';
PRINT '';

-- ========================================
-- 1. Verify Table Exists
-- ========================================
PRINT '1?? Checking Transactions Table...';
IF OBJECT_ID('Transactions', 'U') IS NOT NULL
BEGIN
    PRINT '? Transactions table exists';
    PRINT '';
    
    SELECT 
        COLUMN_NAME as 'Column',
        DATA_TYPE as 'Type',
        CHARACTER_MAXIMUM_LENGTH as 'MaxLength',
        IS_NULLABLE as 'Nullable',
        COLUMN_DEFAULT as 'Default'
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Transactions'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '? Transactions table does NOT exist';
    PRINT 'Please run: dotnet ef database update';
    PRINT '';
    RETURN;
END
PRINT '';

-- ========================================
-- 2. Check Indexes
-- ========================================
PRINT '2?? Checking Indexes...';
SELECT 
    i.name as 'Index Name',
    i.type_desc as 'Type',
    STRING_AGG(c.name, ', ') as 'Columns'
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('Transactions')
GROUP BY i.name, i.type_desc
ORDER BY i.name;
PRINT '';

-- ========================================
-- 3. Check Foreign Key Relationships
-- ========================================
PRINT '3?? Checking Foreign Keys...';
SELECT 
    fk.name as 'FK Name',
    OBJECT_NAME(fk.parent_object_id) as 'From Table',
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as 'From Column',
    OBJECT_NAME(fk.referenced_object_id) as 'To Table',
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as 'To Column',
    fk.delete_referential_action_desc as 'On Delete'
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.parent_object_id = OBJECT_ID('Transactions');
PRINT '';

-- ========================================
-- 4. Sample Data Check
-- ========================================
DECLARE @transactionCount INT;
SELECT @transactionCount = COUNT(*) FROM Transactions;

PRINT '4?? Transaction Data:';
PRINT CONCAT('Total transactions: ', @transactionCount);
PRINT '';

IF @transactionCount > 0
BEGIN
    PRINT 'Recent Transactions:';
    SELECT TOP 10
        SUBSTRING(CAST(Id AS NVARCHAR(36)), 1, 8) + '...' as 'Transaction ID',
        SUBSTRING(CAST(OrderId AS NVARCHAR(36)), 1, 8) + '...' as 'Order ID',
        Gateway,
        Amount,
        Status,
        TransactionType,
        FORMAT(CreatedAt, 'dd/MM/yyyy HH:mm') as 'Created',
        CASE WHEN CompletedAt IS NOT NULL 
             THEN FORMAT(CompletedAt, 'dd/MM/yyyy HH:mm')
             ELSE 'Pending' 
        END as 'Completed'
    FROM Transactions
    ORDER BY CreatedAt DESC;
    PRINT '';
    
    -- Transaction Status Summary
    PRINT 'Transactions by Status:';
    SELECT 
        Status,
        COUNT(*) as 'Count',
        SUM(Amount) as 'Total Amount'
    FROM Transactions
    GROUP BY Status
    ORDER BY COUNT(*) DESC;
    PRINT '';
    
    -- Transactions by Gateway
    PRINT 'Transactions by Gateway:';
    SELECT 
        Gateway,
        COUNT(*) as 'Count',
        SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) as 'Successful',
        SUM(CASE WHEN Status = 'FAILED' THEN 1 ELSE 0 END) as 'Failed',
        SUM(Amount) as 'Total Amount'
    FROM Transactions
    GROUP BY Gateway
    ORDER BY COUNT(*) DESC;
    PRINT '';
END
ELSE
BEGIN
    PRINT '??  No transactions in database yet';
    PRINT 'Transactions will be created when orders are placed and paid';
END
PRINT '';

-- ========================================
-- 5. Sample Queries
-- ========================================
PRINT '5?? Sample Useful Queries:';
PRINT '';
PRINT '-- Find all transactions for an order:';
PRINT 'SELECT * FROM Transactions WHERE OrderId = ''<order-guid>'' ORDER BY CreatedAt DESC;';
PRINT '';
PRINT '-- Find failed payment attempts:';
PRINT 'SELECT OrderId, Gateway, ErrorMessage, CreatedAt FROM Transactions WHERE Status = ''FAILED'' ORDER BY CreatedAt DESC;';
PRINT '';
PRINT '-- Daily revenue by gateway:';
PRINT 'SELECT CAST(CreatedAt AS DATE) as Date, Gateway, SUM(Amount) as Revenue';
PRINT 'FROM Transactions WHERE Status = ''SUCCESS'' GROUP BY CAST(CreatedAt AS DATE), Gateway;';
PRINT '';
PRINT '-- Transaction success rate by gateway:';
PRINT 'SELECT Gateway,';
PRINT '       COUNT(*) as Total,';
PRINT '       SUM(CASE WHEN Status = ''SUCCESS'' THEN 1 ELSE 0 END) as Successful,';
PRINT '       CAST(SUM(CASE WHEN Status = ''SUCCESS'' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as SuccessRate';
PRINT 'FROM Transactions WHERE TransactionType = ''PAYMENT'' GROUP BY Gateway;';
PRINT '';

-- ========================================
-- 6. Insert Sample Data (Optional)
-- ========================================
PRINT '6?? Sample Transaction Creation:';
PRINT '';
PRINT 'To create a test transaction via API:';
PRINT 'POST /api/v1/transactions';
PRINT '{';
PRINT '  "orderId": "<order-guid>",';
PRINT '  "gateway": "VNPAY",';
PRINT '  "amount": 1500000,';
PRINT '  "transactionType": "PAYMENT"';
PRINT '}';
PRINT '';

-- Check if we should insert sample data
IF @transactionCount = 0 AND EXISTS (SELECT 1 FROM Orders WHERE PaymentStatus = 'Pending')
BEGIN
    PRINT '??  Found orders without transactions. Create test transaction? (Uncomment to proceed)';
    PRINT '';
    
    /*
    -- Uncomment to insert sample transaction
    DECLARE @sampleOrderId UNIQUEIDENTIFIER;
    SELECT TOP 1 @sampleOrderId = Id FROM Orders WHERE PaymentStatus = 'Pending';
    
    IF @sampleOrderId IS NOT NULL
    BEGIN
        INSERT INTO Transactions (
            Id, OrderId, Gateway, Amount, Status, TransactionType,
            IpAddress, CreatedAt, UpdatedAt
        )
        VALUES (
            NEWID(),
            @sampleOrderId,
            'COD',
            (SELECT TotalAmount FROM Orders WHERE Id = @sampleOrderId),
            'SUCCESS',
            'PAYMENT',
            '127.0.0.1',
            GETUTCDATE(),
            GETUTCDATE()
        );
        
        UPDATE Orders SET PaymentStatus = 'Paid', UpdatedAt = GETUTCDATE()
        WHERE Id = @sampleOrderId;
        
        PRINT '? Sample transaction created';
    END
    */
END
PRINT '';

-- ========================================
-- 7. Health Checks
-- ========================================
PRINT '7?? Health Checks:';
PRINT '';

-- Check for orders with payments but no transactions
DECLARE @paidOrdersWithoutTransactions INT;
SELECT @paidOrdersWithoutTransactions = COUNT(*)
FROM Orders o
WHERE o.PaymentStatus = 'Paid'
  AND NOT EXISTS (
      SELECT 1 FROM Transactions t 
      WHERE t.OrderId = o.Id AND t.Status = 'SUCCESS'
  );

IF @paidOrdersWithoutTransactions > 0
    PRINT CONCAT('??  WARNING: ', @paidOrdersWithoutTransactions, ' paid orders have no successful transaction record');
ELSE
    PRINT '? All paid orders have transaction records';
PRINT '';

-- Check for orphaned transactions
DECLARE @orphanedTransactions INT;
SELECT @orphanedTransactions = COUNT(*)
FROM Transactions t
WHERE NOT EXISTS (SELECT 1 FROM Orders o WHERE o.Id = t.OrderId);

IF @orphanedTransactions > 0
    PRINT CONCAT('??  WARNING: ', @orphanedTransactions, ' transactions reference non-existent orders');
ELSE
    PRINT '? No orphaned transactions found';
PRINT '';

-- Check for stuck pending transactions (older than 1 hour)
DECLARE @stuckTransactions INT;
SELECT @stuckTransactions = COUNT(*)
FROM Transactions
WHERE Status = 'PENDING' 
  AND DATEDIFF(HOUR, CreatedAt, GETUTCDATE()) > 1;

IF @stuckTransactions > 0
BEGIN
    PRINT CONCAT('??  WARNING: ', @stuckTransactions, ' transactions stuck in PENDING status > 1 hour');
    PRINT '';
    PRINT 'Stuck Transactions:';
    SELECT 
        SUBSTRING(CAST(Id AS NVARCHAR(36)), 1, 8) + '...' as 'Transaction ID',
        Gateway,
        Amount,
        DATEDIFF(HOUR, CreatedAt, GETUTCDATE()) as 'Hours Pending',
        FORMAT(CreatedAt, 'dd/MM/yyyy HH:mm') as 'Created'
    FROM Transactions
    WHERE Status = 'PENDING' 
      AND DATEDIFF(HOUR, CreatedAt, GETUTCDATE()) > 1
    ORDER BY CreatedAt;
END
ELSE
    PRINT '? No stuck pending transactions';
PRINT '';

-- ========================================
-- 8. Summary
-- ========================================
PRINT '========================================';
PRINT '? Verification Complete';
PRINT '========================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Test transaction creation via API';
PRINT '2. Integrate with VNPay/MoMo payment gateways';
PRINT '3. Set up webhook endpoints for payment callbacks';
PRINT '4. Implement signature verification for webhooks';
PRINT '5. Monitor transaction success rates';
PRINT '';
