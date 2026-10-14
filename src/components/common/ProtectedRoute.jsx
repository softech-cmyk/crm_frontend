import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";

function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === "loading") return null;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
