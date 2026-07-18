import { createBrowserRouter } from "react-router";
import { AdminRoute, GuestRoute, ProtectedRoute } from "@/components/guards";
import AppLayout from "@/components/layout/AppLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Dashboard from "@/pages/app/Dashboard";
import Modules from "@/pages/app/Modules";
import ModuleDetail from "@/pages/app/ModuleDetail";
import LessonPlayer from "@/pages/app/LessonPlayer";
import Payments from "@/pages/app/Payments";
import Profile from "@/pages/app/Profile";
import Subscribe from "@/pages/app/Subscribe";
import PaymentCallback from "@/pages/app/PaymentCallback";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Students from "@/pages/admin/Students";
import AdminModules from "@/pages/admin/AdminModules";
import Uploads from "@/pages/admin/Uploads";

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },

  {
    element: <GuestRoute />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/modules", element: <Modules /> },
          { path: "/modules/:id", element: <ModuleDetail /> },
          { path: "/lessons/:id", element: <LessonPlayer /> },
          { path: "/payments", element: <Payments /> },
          { path: "/profile", element: <Profile /> },
        ],
      },
      // Full-page flows without the app sidebar
      { path: "/subscribe", element: <Subscribe /> },
      { path: "/payment/callback", element: <PaymentCallback /> },
    ],
  },

  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/admin", element: <AdminDashboard /> },
          { path: "/admin/students", element: <Students /> },
          { path: "/admin/modules", element: <AdminModules /> },
          { path: "/admin/uploads", element: <Uploads /> },
        ],
      },
    ],
  },

  { path: "*", element: <NotFound /> },
]);
