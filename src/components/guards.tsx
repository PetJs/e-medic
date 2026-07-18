import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/lib/auth";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

/** Requires an authenticated user; redirects to /login otherwise. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

/** Requires an admin user; redirects students to their dashboard. */
export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/** For login/signup — sends already-authenticated users to their dashboard. */
export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return <Outlet />;
}
