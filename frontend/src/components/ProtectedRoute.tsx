import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireUpload?: boolean;
}

export function ProtectedRoute({ children, requireAdmin, requireUpload }: ProtectedRouteProps) {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (requireUpload && user.role !== "admin" && user.role !== "uploader") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
