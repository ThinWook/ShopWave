# Sơ đồ Cơ sở Dữ liệu ShopWave - Mermaid Diagram

```mermaid
erDiagram
    USERS {
        string id PK
        string email UK
        string password_hash
        string full_name
        string phone
        string avatar_url
        datetime created_at
        datetime updated_at
        boolean is_active
        string role
    }

    CATEGORIES {
        string id PK
        string name UK
        string description
        string image_url
        string parent_id FK
        integer sort_order
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    PRODUCTS {
        string id PK
        string name
        text description
        decimal price
        string category_id FK
        string image_url
        string image_ai_hint
        decimal rating
        integer reviews_count
        integer popularity
        json attributes
        boolean is_active
        integer stock_quantity
        datetime created_at
        datetime updated_at
    }

    REVIEWS {
        string id PK
        string product_id FK
        string user_id FK
        string user_name
        integer rating
        text comment
        datetime date
        boolean is_verified
        datetime created_at
        datetime updated_at
    }

    CART_ITEMS {
        string id PK
        string user_id FK
        string product_id FK
        integer quantity
        decimal unit_price
        datetime created_at
        datetime updated_at
    }

    WISHLIST_ITEMS {
        string id PK
        string user_id FK
        string product_id FK
        datetime created_at
    }

    ORDERS {
        string id PK
        string user_id FK
        string order_number UK
        decimal total_amount
        string status
        string shipping_address
        string billing_address
        string payment_method
        string payment_status
        datetime order_date
        datetime shipped_date
        datetime delivered_date
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        string id PK
        string order_id FK
        string product_id FK
        string product_name
        integer quantity
        decimal unit_price
        decimal total_price
        datetime created_at
    }

    BROWSING_HISTORY {
        string id PK
        string user_id FK
        string product_id FK
        datetime viewed_at
        integer view_duration
        string session_id
    }

    PRODUCT_RECOMMENDATIONS {
        string id PK
        string user_id FK
        string product_id FK
        decimal recommendation_score
        string recommendation_type
        datetime generated_at
        datetime expires_at
    }

    USER_SETTINGS {
        string id PK
        string user_id FK
        string setting_key
        string setting_value
        datetime created_at
        datetime updated_at
    }

    NOTIFICATIONS {
        string id PK
        string user_id FK
        string title
        text message
        string type
        boolean is_read
        datetime created_at
        datetime read_at
    }

    USER_SESSIONS {
        string id PK
        string user_id FK
        string session_token
        datetime expires_at
        string ip_address
        string user_agent
        datetime created_at
        datetime last_activity
    }

    SEARCH_QUERIES {
        string id PK
        string user_id FK
        string query_text
        json filters_applied
        integer results_count
        datetime searched_at
    }

    USER_ACTIVITY {
        string id PK
        string user_id FK
        string activity_type
        string entity_type
        string entity_id
        json metadata
        datetime created_at
    }

    %% Relationships
    USERS ||--o{ REVIEWS : "writes"
    USERS ||--o{ CART_ITEMS : "has"
    USERS ||--o{ WISHLIST_ITEMS : "saves"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ BROWSING_HISTORY : "tracks"
    USERS ||--o{ PRODUCT_RECOMMENDATIONS : "receives"
    USERS ||--o{ USER_SETTINGS : "configures"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ USER_SESSIONS : "maintains"
    USERS ||--o{ SEARCH_QUERIES : "performs"
    USERS ||--o{ USER_ACTIVITY : "generates"

    CATEGORIES ||--o{ PRODUCTS : "contains"
    CATEGORIES ||--o{ CATEGORIES : "parent_of"

    PRODUCTS ||--o{ REVIEWS : "receives"
    PRODUCTS ||--o{ CART_ITEMS : "added_to"
    PRODUCTS ||--o{ WISHLIST_ITEMS : "saved_in"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered_as"
    PRODUCTS ||--o{ BROWSING_HISTORY : "viewed_in"
    PRODUCTS ||--o{ PRODUCT_RECOMMENDATIONS : "recommended_as"

    ORDERS ||--o{ ORDER_ITEMS : "contains"
```

## Giải thích các mối quan hệ chính:

### 1. Quan hệ User-centric (Người dùng là trung tâm)

- **USERS** là bảng trung tâm kết nối với hầu hết các bảng khác
- Mỗi user có thể có nhiều reviews, cart items, wishlist items, orders, v.v.

### 2. Quan hệ Product-centric (Sản phẩm là trung tâm)

- **PRODUCTS** kết nối với categories, reviews, cart, wishlist, orders
- **CATEGORIES** có thể có cấu trúc cây (parent-child relationship)

### 3. Quan hệ Order Management (Quản lý đơn hàng)

- **ORDERS** chứa thông tin tổng quan về đơn hàng
- **ORDER_ITEMS** chứa chi tiết từng sản phẩm trong đơn hàng

### 4. Quan hệ AI & Analytics (Trí tuệ nhân tạo & Phân tích)

- **BROWSING_HISTORY** theo dõi hành vi người dùng
- **PRODUCT_RECOMMENDATIONS** lưu trữ gợi ý từ AI
- **USER_ACTIVITY** ghi lại mọi hoạt động của người dùng

### 5. Quan hệ System Management (Quản lý hệ thống)

- **USER_SETTINGS** lưu cài đặt cá nhân
- **NOTIFICATIONS** quản lý thông báo
- **USER_SESSIONS** quản lý phiên đăng nhập
