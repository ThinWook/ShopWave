import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen text-gray-600 dark:text-gray-300">Đang tải...</div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (user.role !== "Admin") {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}
