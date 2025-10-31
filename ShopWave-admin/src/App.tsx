import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
// Đã xóa SignUp
import NotFound from "./pages/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import AddProduct from "./pages/AddProduct";
import Categories from "./pages/Categories";
import Transactions from "./pages/Transactions";
import SingleTransaction from "./pages/SingleTransaction";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import SingleInvoice from "./pages/SingleInvoice";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Products from "./pages/Products";
import Chats from "./pages/Chats";
import ProductDetail from "./pages/ProductDetail";
import ProductEdit from "./pages/ProductEdit";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}> 
            <Route element={<AppLayout />}>
            {/* Root now points to Products instead of Dashboard */}
            <Route index path="/" element={<Products />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transaction/:id" element={<SingleTransaction />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/create-invoice" element={<CreateInvoice />} />
            <Route path="/invoice/:id" element={<SingleInvoice />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
            <Route path="/chats" element={<Chats />} />
            </Route>
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          {/* Đã xóa route đăng ký */}

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}
