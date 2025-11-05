-- ================================================================
-- SCRIPT: Xóa và t?o l?i database t? ??u
-- ================================================================
-- Ch?y script này trong SQL Server Management Studio ho?c Azure Data Studio
-- ================================================================

USE master;
GO

-- Drop database n?u t?n t?i
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'ShopWaveDB')
BEGIN
    ALTER DATABASE ShopWaveDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ShopWaveDB;
    PRINT '? Database ShopWaveDB dropped successfully';
END
ELSE
BEGIN
    PRINT '?? Database ShopWaveDB does not exist';
END
GO

-- T?o database m?i
CREATE DATABASE ShopWaveDB;
GO

PRINT '? Database ShopWaveDB created successfully';
PRINT '';
PRINT '=== NEXT STEPS ===';
PRINT '1. Close this SQL window';
PRINT '2. Run: dotnet ef database update';
PRINT '3. All tables will be created from scratch';
GO
