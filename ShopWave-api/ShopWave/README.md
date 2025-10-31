# ShopWave API

ShopWave là m?t Web API cho ?ng d?ng th??ng m?i ?i?n t? ???c xây d?ng b?ng ASP.NET Core 8.0, ???c thi?t k? ?? làm vi?c v?i frontend Next.js.

## C?u trúc Project

```
ShopWave/
??? Controllers/              # API Controllers
?   ??? AuthController.cs        # Authentication endpoints
?   ??? CartController.cs        # Shopping cart management
?   ??? CategoriesController.cs  # Product categories
?   ??? HomeController.cs        # Dashboard & health check
?   ??? OrdersController.cs      # Order management
?   ??? ProductsController.cs    # Product management
?   ??? ReviewsController.cs     # Product reviews
?   ??? UsersController.cs       # User profile management
?   ??? WishlistController.cs    # Wishlist management
??? Models/                   # Data models
?   ??? DTOs/                 # Data Transfer Objects
?   ??? Requests/             # API Request models
?   ??? Responses/            # API Response models
?   ??? [Entity Models]       # Database entities
??? Extensions/               # Extension methods
??? Repositories/             # Repository interfaces
??? Program.cs               # Application entry point
```

## Tính n?ng chính

- ? **Authentication**: ??ng ký, ??ng nh?p, logout, refresh token
- ? **User Management**: Profile, change password, admin user listing
- ? **Product Management**: CRUD operations, search, filter, pagination
- ? **Category Management**: Qu?n lý danh m?c s?n ph?m v?i tree structure
- ? **Shopping Cart**: Thêm, s?a, xóa s?n ph?m trong gi? hàng
- ? **Order Management**: T?o ??n hàng, xem l?ch s?, h?y ??n
- ? **Product Reviews**: ?ánh giá s?n ph?m, qu?n lý reviews
- ? **Wishlist**: Danh sách yêu thích, move to cart
- ? **Database Seeding**: T?o d? li?u m?u t? ??ng
- ? **CORS Support**: H? tr? Next.js frontend
- ? **Swagger Documentation**: API documentation t? ??ng

## API Endpoints

### Authentication
- `POST /api/auth/register` - ??ng ký ng??i dùng m?i
- `POST /api/auth/login` - ??ng nh?p
- `POST /api/auth/refresh` - Làm m?i token
- `POST /api/auth/logout` - ??ng xu?t
- `GET /api/auth/me` - L?y thông tin ng??i dùng hi?n t?i

### Users
- `GET /api/users/me` - L?y profile c?a user hi?n t?i
- `PUT /api/users/me` - C?p nh?t profile
- `PUT /api/users/me/password` - ??i m?t kh?u
- `GET /api/users/{id}` - L?y thông tin user (Admin only)
- `GET /api/users` - L?y danh sách users (Admin only)

### Products
- `GET /api/products` - L?y danh sách s?n ph?m (có phân trang, tìm ki?m, l?c)
- `GET /api/products/{id}` - L?y chi ti?t s?n ph?m
- `GET /api/products/{id}/reviews` - L?y ?ánh giá s?n ph?m
- `GET /api/products/featured` - L?y s?n ph?m n?i b?t
- `GET /api/products/{id}/related` - L?y s?n ph?m liên quan

### Categories
- `GET /api/categories` - L?y danh sách danh m?c
- `GET /api/categories/{id}` - L?y chi ti?t danh m?c
- `GET /api/categories/tree` - L?y cây danh m?c
- `GET /api/categories/{id}/products` - L?y s?n ph?m theo danh m?c

### Reviews
- `POST /api/reviews` - T?o ?ánh giá s?n ph?m
- `PUT /api/reviews/{id}` - C?p nh?t ?ánh giá
- `DELETE /api/reviews/{id}` - Xóa ?ánh giá
- `GET /api/reviews/user/me` - L?y danh sách ?ánh giá c?a user

### Shopping Cart
- `GET /api/cart` - L?y gi? hàng
- `POST /api/cart/add` - Thêm s?n ph?m vào gi? hàng
- `PUT /api/cart/{id}` - C?p nh?t s? l??ng s?n ph?m
- `DELETE /api/cart/{id}` - Xóa s?n ph?m kh?i gi? hàng
- `DELETE /api/cart/clear` - Xóa toàn b? gi? hàng

### Orders
- `POST /api/orders` - T?o ??n hàng t? gi? hàng
- `GET /api/orders` - L?y danh sách ??n hàng c?a user
- `GET /api/orders/{id}` - L?y chi ti?t ??n hàng
- `PUT /api/orders/{id}/cancel` - H?y ??n hàng

### Wishlist
- `GET /api/wishlist` - L?y danh sách yêu thích
- `POST /api/wishlist` - Thêm s?n ph?m vào wishlist
- `DELETE /api/wishlist/{productId}` - Xóa s?n ph?m kh?i wishlist
- `GET /api/wishlist/check/{productId}` - Ki?m tra s?n ph?m có trong wishlist
- `DELETE /api/wishlist/clear` - Xóa toàn b? wishlist
- `POST /api/wishlist/move-to-cart/{productId}` - Chuy?n t? wishlist sang cart

### Dashboard
- `GET /api/home/dashboard` - L?y th?ng kê dashboard
- `GET /api/home/health` - Health check

## C?u hình CORS

API ?ã ???c c?u hình CORS ?? h? tr? Next.js frontend:
- Development: `http://localhost:3000`
- Production: `https://localhost:3001`

## Database Models

### Core Entities
- **User**: Qu?n lý ng??i dùng v?i roles và sessions
- **Category**: Danh m?c s?n ph?m (h? tr? cây danh m?c)
- **Product**: S?n ph?m v?i rating, stock, attributes
- **Review**: ?ánh giá s?n ph?m v?i verified status
- **CartItem**: Gi? hàng
- **Order & OrderItem**: ??n hàng v?i order tracking
- **WishlistItem**: Danh sách yêu thích
- **ProductRecommendation**: G?i ý s?n ph?m
- **BrowsingHistory**: L?ch s? duy?t
- **Notification**: Thông báo
- **UserSetting**: Cài ??t ng??i dùng
- **UserSession**: Phiên ??ng nh?p

## Authentication

API s? d?ng session-based authentication:
1. Register/Login ?? nh?n session token
2. G?i token trong header `Authorization: Bearer <token>`
3. Token có th?i h?n 30 ngày
4. Refresh token ?? gia h?n phiên

## Ví d? s? d?ng v?i Next.js

### Authentication Flow
```javascript
// Register
const register = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return await response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
  }
  return data;
};
```

### Product Operations
```javascript
// Get products with filters
const getProducts = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    pageSize: filters.pageSize || 12,
    ...filters
  });
  
  const response = await fetch(`/api/products?${params}`);
  return await response.json();
};

// Get product details
const getProduct = async (id) => {
  const response = await fetch(`/api/products/${id}`);
  return await response.json();
};
```

### Cart Operations
```javascript
// Add to cart
const addToCart = async (productId, quantity) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });
  
  return await response.json();
};

// Get cart
const getCart = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/cart', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
```

### Order Management
```javascript
// Create order
const createOrder = async (orderData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  
  return await response.json();
};

// Get user orders
const getMyOrders = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/orders', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
```

### Wishlist Operations
```javascript
// Add to wishlist
const addToWishlist = async (productId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/wishlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
  });
  
  return await response.json();
};

// Move from wishlist to cart
const moveToCart = async (productId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/wishlist/move-to-cart/${productId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
```

## Error Handling

API s? d?ng chu?n HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (need login)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

Response format:
```json
{
  "success": true/false,
  "message": "Descriptive message",
  "data": {...}, // Only on success
  "errors": [...] // Only on error
}
```

## Security Features

- ? Password hashing v?i BCrypt
- ? Session management v?i token expiry
- ? Input validation v?i Data Annotations
- ? SQL injection protection v?i EF Core
- ? CORS configuration
- ? Authorization policies

## Performance Features

- ? Database indexing cho performance
- ? Pagination cho large datasets
- ? Efficient queries v?i projection
- ? Lazy loading control
- ? Connection pooling

## Development Notes

- Database ???c seed v?i d? li?u m?u khi kh?i ??ng
- Logging ???c c?u hình v?i Serilog
- API documentation t? ??ng v?i Swagger
- Error handling ???c x? lý t?p trung
- Validation messages b?ng ti?ng Vi?t

## Tri?n khai Production

### Cài ??t
```bash
# Clone repository
git clone [your-repo-url]
cd ShopWave

# Restore packages
dotnet restore

# Update connection string in appsettings.json
# Run migrations
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run application
dotnet run
```

### Environment Variables
```bash
ASPNETCORE_ENVIRONMENT=Production
CONNECTION_STRING=your_production_connection_string
CORS_ORIGINS=https://yourdomain.com
```

## Next Steps

1. ? Implement Admin Controllers cho management
2. ? Add JWT authentication thay vì session
3. ? Implement caching layer (Redis)
4. ? Add email service cho notifications
5. ? File upload cho product images
6. ? Payment integration
7. ? Real-time notifications v?i SignalR
8. ? Unit tests
9. ? Rate limiting
10. ? Search v?i Elasticsearch

## License

MIT License