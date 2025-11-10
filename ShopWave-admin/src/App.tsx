import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/common/ErrorBoundary";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Skeleton from "./components/ui/Skeleton";

// Helper component for redirecting /order/:id to /orders/:id
function OrderRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/orders/${id}`} replace />;
}

// Lazy load components
// Add logging when lazy modules are resolved to help diagnose runtime import/shape issues.
const UserProfiles = lazy(() => import("./pages/UserProfiles").then(m => { console.log('lazy loaded: UserProfiles', m); return m; }));
const Calendar = lazy(() => import("./pages/Calendar").then(m => { console.log('lazy loaded: Calendar', m); return m; }));
const Categories = lazy(() => import("./pages/Categories").then(m => { console.log('lazy loaded: Categories', m); return m; }));
const Transactions = lazy(() => import("./pages/Transactions").then(m => { console.log('lazy loaded: Transactions', m); return m; }));
const SingleTransaction = lazy(() => import("./pages/SingleTransaction").then(m => { console.log('lazy loaded: SingleTransaction', m); return m; }));
const Orders = lazy(() => import("./pages/Orders").then(m => {
  // Defensive: prefer the module.default; otherwise try common named exports; otherwise
  // pick the first exported function (likely the React component). Do NOT return the
  // module namespace object as the default — React.lazy expects a component function/class.
  const mod: any = m;
  const candidates = [mod.default, mod.Orders, mod.OrdersPage];
  let component: any = candidates.find(c => typeof c === 'function');
  if (!component) {
    // Look for any function export as a last resort
    const vals = Object.values(mod);
    component = vals.find(v => typeof v === 'function');
  }

  try {
    console.log('lazy loaded: Orders', {
      keys: Object.keys(mod),
      hasDefault: Object.prototype.hasOwnProperty.call(mod, 'default'),
      defaultType: typeof mod.default,
      resolvedType: typeof component,
      module: mod,
    });
  } catch (e) {
    console.log('lazy loaded: Orders (log failed)', e, mod);
  }

  if (typeof component === 'function') {
    return { default: component } as any;
  }

  // If we couldn't find any component export, return a fallback component that renders null
  console.warn('Orders lazy import did not export a component. Rendering empty placeholder.');
  return { default: () => null } as any;
}));
const OrderDetail = lazy(() => import("./pages/OrderDetail").then(m => { console.log('lazy loaded: OrderDetail', m); return m; }));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => { console.log('lazy loaded: AdminDashboard', m); return m; }));
const Products = lazy(() => import("./pages/Products").then(m => { console.log('lazy loaded: Products', m); return m; }));
const Chats = lazy(() => import("./pages/Chats").then(m => { console.log('lazy loaded: Chats', m); return m; }));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then(m => { console.log('lazy loaded: ProductDetail', m); return m; }));
const ProductEdit = lazy(() => import("./pages/ProductEdit").then(m => { console.log('lazy loaded: ProductEdit', m); return m; }));
const AddProduct = lazy(() => import("./pages/AddProduct").then(m => { console.log('lazy loaded: AddProduct', m); return m; }));
const Vouchers = lazy(() => import('./pages/Vouchers').then(m => { console.log('lazy loaded: Vouchers', m); return m; }));

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><Skeleton className="h-20 w-20" /></div>}>
              <Routes>
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  {/* Redirect root to /products */}
                  <Route index element={<Navigate to="/products" replace />} />
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/add-product" element={<AddProduct />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/products/:id/edit" element={<ProductEdit />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/vouchers" element={<Vouchers />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/transaction/:id" element={<SingleTransaction />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  {/* Legacy compatibility routes redirect to /orders */}
                  <Route path="/invoices" element={<Navigate to="/orders" replace />} />
                  <Route path="/create-invoice" element={<Navigate to="/orders" replace />} />
                  <Route path="/invoice/:id" element={<Navigate to="/orders" replace />} />
                  {/* Backward compatibility: /order/:id redirects to /orders/:id */}
                  <Route path="/order/:id" element={<OrderRedirect />} />
                  <Route path="/chats" element={<Chats />} />
                  <Route path="/profile" element={<UserProfiles />} />
                  <Route path="/calendar" element={<Calendar />} />
                </Route>
              </Route>

              {/* Auth Layout */}
              <Route path="/signin" element={<SignIn />} />

              {/* Fallback Route */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </>
  );
}
