import { BarChart3, BookOpen, FileUp, HelpCircle, LayoutDashboard, Users } from "lucide-react";
import { SidebarShell, type NavItem } from "@/components/layout/SidebarShell";

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/uploads", label: "Uploads", icon: FileUp },
  { to: "/admin/modules", label: "Modules", icon: BookOpen },
  { to: "/admin/quiz", label: "Quiz Questions", icon: HelpCircle },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout() {
  return (
    <SidebarShell navItems={navItems} homeTo="/admin" roleLabel="Administrator" />
  );
}
