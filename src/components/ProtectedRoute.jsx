import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, staffOnly = false }) {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Yuklanmoqda...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/" replace />;
  }

  return children;
}
