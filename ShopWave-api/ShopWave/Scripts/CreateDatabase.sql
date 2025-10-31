-- Script to create ShopWaveDB database and verify connection
-- Run this in SQL Server Management Studio if needed

USE master;
GO

-- Check if database exists, create if not
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ShopWaveDB')
BEGIN
    CREATE DATABASE [ShopWaveDB]
    COLLATE SQL_Latin1_General_CP1_CI_AS;
    PRINT 'Database ShopWaveDB created successfully';
END
ELSE
BEGIN
    PRINT 'Database ShopWaveDB already exists';
END
GO

-- Use the database
USE [ShopWaveDB];
GO

-- Basic connection test
SELECT 
    DB_NAME() AS CurrentDatabase,
    GETDATE() AS CurrentDateTime,
    @@VERSION AS SqlServerVersion;

-- Check if any tables exist (after running migrations)
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
ORDER BY TABLE_NAME;