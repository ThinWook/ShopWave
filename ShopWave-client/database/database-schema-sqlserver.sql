-- =====================================================
-- ShopWave Ecommerce Database Schema - SQL Server Version (PERFECT)
-- =====================================================

-- Tạo database
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'ShopWaveDB')
    DROP DATABASE ShopWaveDB;
GO

CREATE DATABASE ShopWaveDB;
GO

USE ShopWaveDB;
GO

-- =====================================================
-- 1. BẢNG NGƯỜI DÙNG
-- =====================================================

CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20),
    avatar_url NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    role NVARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'))
);
GO

-- =====================================================
-- 2. BẢNG DANH MỤC SẢN PHẨM
-- =====================================================

CREATE TABLE categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) UNIQUE NOT NULL,
    description NVARCHAR(MAX),
    image_url NVARCHAR(MAX),
    parent_id UNIQUEIDENTIFIER NULL,
    sort_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign key cho parent_id sau khi bảng đã tạo
ALTER TABLE categories 
ADD CONSTRAINT FK_categories_parent 
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE NO ACTION;
GO

-- =====================================================
-- 3. BẢNG SẢN PHẨM
-- =====================================================

CREATE TABLE products (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10,2) NOT NULL,
    category_id UNIQUEIDENTIFIER NOT NULL,
    image_url NVARCHAR(MAX),
    image_ai_hint NVARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    popularity INT DEFAULT 0,
    attributes NVARCHAR(MAX), -- JSON as NVARCHAR
    is_active BIT DEFAULT 1,
    stock_quantity INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign key cho category_id
ALTER TABLE products 
ADD CONSTRAINT FK_products_category 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE NO ACTION;
GO

-- =====================================================
-- 4. BẢNG ĐÁNH GIÁ SẢN PHẨM
-- =====================================================

CREATE TABLE reviews (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    user_name NVARCHAR(255) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment NVARCHAR(MAX),
    date DATE DEFAULT CAST(GETDATE() AS DATE),
    is_verified BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign keys cho reviews
ALTER TABLE reviews 
ADD CONSTRAINT FK_reviews_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
GO

ALTER TABLE reviews 
ADD CONSTRAINT FK_reviews_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

-- =====================================================
-- 5. BẢNG GIỎ HÀNG
-- =====================================================

CREATE TABLE cart_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign keys và unique constraint cho cart_items
ALTER TABLE cart_items 
ADD CONSTRAINT FK_cart_items_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

ALTER TABLE cart_items 
ADD CONSTRAINT FK_cart_items_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
GO

ALTER TABLE cart_items 
ADD CONSTRAINT UQ_user_product UNIQUE (user_id, product_id);
GO

-- =====================================================
-- 6. BẢNG DANH SÁCH YÊU THÍCH
-- =====================================================

CREATE TABLE wishlist_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign keys và unique constraint cho wishlist_items
ALTER TABLE wishlist_items 
ADD CONSTRAINT FK_wishlist_items_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

ALTER TABLE wishlist_items 
ADD CONSTRAINT FK_wishlist_items_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
GO

ALTER TABLE wishlist_items 
ADD CONSTRAINT UQ_user_wishlist UNIQUE (user_id, product_id);
GO

-- =====================================================
-- 7. BẢNG ĐƠN HÀNG
-- =====================================================

CREATE TABLE orders (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    order_number NVARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address NVARCHAR(MAX) NOT NULL, -- JSON as NVARCHAR
    billing_address NVARCHAR(MAX) NOT NULL, -- JSON as NVARCHAR
    payment_method NVARCHAR(50),
    payment_status NVARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_date DATETIME2 DEFAULT GETDATE(),
    shipped_date DATETIME2 NULL,
    delivered_date DATETIME2 NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign key cho orders
ALTER TABLE orders 
ADD CONSTRAINT FK_orders_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION;
GO

-- =====================================================
-- 8. BẢNG CHI TIẾT ĐƠN HÀNG
-- =====================================================

CREATE TABLE order_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    product_name NVARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign keys cho order_items
ALTER TABLE order_items 
ADD CONSTRAINT FK_order_items_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
GO

ALTER TABLE order_items 
ADD CONSTRAINT FK_order_items_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE NO ACTION;
GO

-- =====================================================
-- 9. BẢNG LỊCH SỬ DUYỆT WEB
-- =====================================================

CREATE TABLE browsing_history (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    viewed_at DATETIME2 DEFAULT GETDATE(),
    view_duration INT DEFAULT 0, -- seconds
    session_id NVARCHAR(100)
);
GO

-- Thêm foreign keys cho browsing_history
ALTER TABLE browsing_history 
ADD CONSTRAINT FK_browsing_history_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

ALTER TABLE browsing_history 
ADD CONSTRAINT FK_browsing_history_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
GO

-- =====================================================
-- 10. BẢNG GỢI Ý SẢN PHẨM AI
-- =====================================================

CREATE TABLE product_recommendations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    recommendation_score DECIMAL(3,2) NOT NULL,
    recommendation_type NVARCHAR(20) DEFAULT 'browsing' CHECK (recommendation_type IN ('browsing', 'purchase', 'similar', 'trending')),
    generated_at DATETIME2 DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL
);
GO

-- Thêm foreign keys cho product_recommendations
ALTER TABLE product_recommendations 
ADD CONSTRAINT FK_product_recommendations_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

ALTER TABLE product_recommendations 
ADD CONSTRAINT FK_product_recommendations_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
GO

-- =====================================================
-- 11. BẢNG CÀI ĐẶT NGƯỜI DÙNG
-- =====================================================

CREATE TABLE user_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    setting_key NVARCHAR(100) NOT NULL,
    setting_value NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign key và unique constraint cho user_settings
ALTER TABLE user_settings 
ADD CONSTRAINT FK_user_settings_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

ALTER TABLE user_settings 
ADD CONSTRAINT UQ_user_setting UNIQUE (user_id, setting_key);
GO

-- =====================================================
-- 12. BẢNG THÔNG BÁO
-- =====================================================

CREATE TABLE notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'promotion')),
    is_read BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    read_at DATETIME2 NULL
);
GO

-- Thêm foreign key cho notifications
ALTER TABLE notifications 
ADD CONSTRAINT FK_notifications_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

-- =====================================================
-- 13. BẢNG PHIÊN ĐĂNG NHẬP
-- =====================================================

CREATE TABLE user_sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    session_token NVARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME2 NOT NULL,
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    last_activity DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign key cho user_sessions
ALTER TABLE user_sessions 
ADD CONSTRAINT FK_user_sessions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

-- =====================================================
-- 14. BẢNG TÌM KIẾM VÀ LỌC
-- =====================================================

CREATE TABLE search_queries (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER,
    query_text NVARCHAR(500) NOT NULL,
    filters_applied NVARCHAR(MAX), -- JSON as NVARCHAR
    results_count INT DEFAULT 0,
    searched_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign key cho search_queries
ALTER TABLE search_queries 
ADD CONSTRAINT FK_search_queries_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
GO

-- =====================================================
-- 15. BẢNG THEO DÕI HÀNH VI
-- =====================================================

CREATE TABLE user_activity (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    activity_type NVARCHAR(50) NOT NULL,
    entity_type NVARCHAR(50) NOT NULL,
    entity_id UNIQUEIDENTIFIER NOT NULL,
    metadata NVARCHAR(MAX), -- JSON as NVARCHAR
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Thêm foreign key cho user_activity
ALTER TABLE user_activity 
ADD CONSTRAINT FK_user_activity_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

-- =====================================================
-- TẠO CÁC CHỈ MỤC (INDEXES) QUAN TRỌNG
-- =====================================================

-- Chỉ mục cho tìm kiếm sản phẩm
CREATE INDEX IX_products_name ON products(name);
GO

CREATE INDEX IX_products_category ON products(category_id);
GO

CREATE INDEX IX_products_price ON products(price);
GO

CREATE INDEX IX_products_rating ON products(rating);
GO

CREATE INDEX IX_products_popularity ON products(popularity DESC);
GO

-- Chỉ mục cho lịch sử duyệt
CREATE INDEX IX_browsing_history_user_date ON browsing_history(user_id, viewed_at DESC);
GO

CREATE INDEX IX_browsing_history_product ON browsing_history(product_id);
GO

-- Chỉ mục cho đơn hàng
CREATE INDEX IX_orders_user_date ON orders(user_id, order_date DESC);
GO

CREATE INDEX IX_orders_status ON orders(status);
GO

CREATE INDEX IX_orders_number ON orders(order_number);
GO

-- Chỉ mục cho gợi ý
CREATE INDEX IX_recommendations_user_score ON product_recommendations(user_id, recommendation_score DESC);
GO

CREATE INDEX IX_recommendations_expires ON product_recommendations(expires_at);
GO

-- Chỉ mục cho giỏ hàng và wishlist
CREATE INDEX IX_cart_user ON cart_items(user_id);
GO

CREATE INDEX IX_wishlist_user ON wishlist_items(user_id);
GO

-- Chỉ mục cho reviews
CREATE INDEX IX_reviews_product ON reviews(product_id);
GO

CREATE INDEX IX_reviews_user ON reviews(user_id);
GO

-- Chỉ mục cho thông báo
CREATE INDEX IX_notifications_user_read ON notifications(user_id, is_read);
GO

CREATE INDEX IX_notifications_created ON notifications(created_at DESC);
GO

-- Chỉ mục cho phiên đăng nhập
CREATE INDEX IX_sessions_token ON user_sessions(session_token);
GO

CREATE INDEX IX_sessions_expires ON user_sessions(expires_at);
GO

-- Chỉ mục cho hoạt động người dùng
CREATE INDEX IX_activity_user_type ON user_activity(user_id, activity_type);
GO

CREATE INDEX IX_activity_entity ON user_activity(entity_type, entity_id);
GO

-- =====================================================
-- TẠO CÁC TRIGGER ĐỂ CẬP NHẬT DỮ LIỆU TỰ ĐỘNG
-- =====================================================

-- Trigger cập nhật rating và reviews_count khi có review mới
CREATE TRIGGER TR_update_product_rating_after_review_insert
ON reviews
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE p 
    SET 
        rating = (
            SELECT AVG(CAST(rating AS FLOAT)) 
            FROM reviews 
            WHERE product_id = i.product_id
        ),
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE product_id = i.product_id
        ),
        updated_at = GETDATE()
    FROM products p
    INNER JOIN inserted i ON p.id = i.product_id;
END;
GO

-- Trigger cập nhật rating và reviews_count khi xóa review
CREATE TRIGGER TR_update_product_rating_after_review_delete
ON reviews
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE p 
    SET 
        rating = ISNULL((
            SELECT AVG(CAST(rating AS FLOAT)) 
            FROM reviews 
            WHERE product_id = d.product_id
        ), 0),
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE product_id = d.product_id
        ),
        updated_at = GETDATE()
    FROM products p
    INNER JOIN deleted d ON p.id = d.product_id;
END;
GO

-- Trigger tạo order_number tự động
CREATE TRIGGER TR_generate_order_number
ON orders
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO orders (
        id, user_id, order_number, total_amount, status, 
        shipping_address, billing_address, payment_method, 
        payment_status, order_date, shipped_date, delivered_date, 
        created_at, updated_at
    )
    SELECT 
        ISNULL(i.id, NEWID()),
        i.user_id,
        CASE 
            WHEN i.order_number IS NULL OR i.order_number = '' 
            THEN 'ORD' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8)
            ELSE i.order_number
        END,
        i.total_amount,
        ISNULL(i.status, 'pending'),
        i.shipping_address,
        i.billing_address,
        i.payment_method,
        ISNULL(i.payment_status, 'pending'),
        ISNULL(i.order_date, GETDATE()),
        i.shipped_date,
        i.delivered_date,
        ISNULL(i.created_at, GETDATE()),
        ISNULL(i.updated_at, GETDATE())
    FROM inserted i;
END;
GO


-- Đã xóa toàn bộ dữ liệu mẫu (sample data)

-- =====================================================
-- CÁC VIEW HỮU ÍCH
-- =====================================================

-- View sản phẩm với thông tin danh mục
CREATE VIEW v_products_with_category AS
SELECT 
    p.*,
    c.name as category_name,
    c.description as category_description
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = 1;
GO

-- View đơn hàng với thông tin người dùng
CREATE VIEW v_orders_with_user AS
SELECT 
    o.*,
    u.full_name as user_name,
    u.email as user_email
FROM orders o
LEFT JOIN users u ON o.user_id = u.id;
GO

-- View thống kê sản phẩm
CREATE VIEW v_product_stats AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.rating,
    p.reviews_count,
    p.popularity,
    COUNT(DISTINCT r.id) as total_reviews,
    COUNT(DISTINCT ci.id) as cart_additions,
    COUNT(DISTINCT wi.id) as wishlist_additions,
    COUNT(DISTINCT oi.id) as total_orders
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
LEFT JOIN cart_items ci ON p.id = ci.product_id
LEFT JOIN wishlist_items wi ON p.id = wi.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.price, p.rating, p.reviews_count, p.popularity;
GO

-- =====================================================
-- CÁC STORED PROCEDURES HỮU ÍCH
-- =====================================================

-- Procedure thêm sản phẩm vào giỏ hàng
CREATE PROCEDURE sp_AddToCart
    @user_id UNIQUEIDENTIFIER,
    @product_id UNIQUEIDENTIFIER,
    @quantity INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @price DECIMAL(10,2);
    DECLARE @existing_quantity INT = 0;
    
    -- Lấy giá sản phẩm
    SELECT @price = price FROM products WHERE id = @product_id AND is_active = 1;
    
    IF @price IS NULL
    BEGIN
        RAISERROR('Product not found or inactive', 16, 1);
        RETURN;
    END
    
    -- Kiểm tra sản phẩm đã có trong giỏ chưa
    SELECT @existing_quantity = quantity FROM cart_items 
    WHERE user_id = @user_id AND product_id = @product_id;
    
    IF @existing_quantity > 0
    BEGIN
        -- Cập nhật số lượng
        UPDATE cart_items 
        SET quantity = quantity + @quantity, updated_at = GETDATE()
        WHERE user_id = @user_id AND product_id = @product_id;
    END
    ELSE
    BEGIN
        -- Thêm mới
        INSERT INTO cart_items (user_id, product_id, quantity, unit_price)
        VALUES (@user_id, @product_id, @quantity, @price);
    END
END;
GO

-- Procedure tạo đơn hàng từ giỏ hàng
CREATE PROCEDURE sp_CreateOrderFromCart
    @user_id UNIQUEIDENTIFIER,
    @shipping_address NVARCHAR(MAX),
    @billing_address NVARCHAR(MAX),
    @payment_method NVARCHAR(50),
    @order_id UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @total DECIMAL(10,2) = 0;
    DECLARE @order_number NVARCHAR(50);
    
    -- Tính tổng tiền
    SELECT @total = SUM(quantity * unit_price)
    FROM cart_items WHERE user_id = @user_id;
    
    IF @total IS NULL OR @total <= 0
    BEGIN
        RAISERROR('Cart is empty', 16, 1);
        RETURN;
    END
    
    -- Tạo đơn hàng
    SET @order_id = NEWID();
    SET @order_number = 'ORD' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + SUBSTRING(CAST(@order_id AS NVARCHAR(36)), 1, 8);
    
    INSERT INTO orders (id, user_id, order_number, total_amount, shipping_address, billing_address, payment_method)
    VALUES (@order_id, @user_id, @order_number, @total, @shipping_address, @billing_address, @payment_method);
    
    -- Thêm chi tiết đơn hàng
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    SELECT 
        @order_id, 
        ci.product_id, 
        p.name, 
        ci.quantity, 
        ci.unit_price, 
        ci.quantity * ci.unit_price
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = @user_id;
    
    -- Xóa giỏ hàng
    DELETE FROM cart_items WHERE user_id = @user_id;
END;
GO

-- =====================================================
-- KẾT THÚC SCHEMA
-- =====================================================

PRINT 'ShopWave Database Schema created successfully!';
PRINT 'Database: ShopWaveDB';
PRINT 'Tables: 15';
PRINT 'Indexes: 20+';
PRINT 'Triggers: 3';
PRINT 'Views: 3';
PRINT 'Stored Procedures: 2';
PRINT 'Sample Data: Categories, Products, Users, Settings';
