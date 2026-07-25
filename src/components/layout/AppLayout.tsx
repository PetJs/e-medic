import { BookOpen, CreditCard, Home, User as UserIcon } from "lucide-react";
import { SidebarShell, type NavItem } from "@/components/layout/SidebarShell";

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/modules", label: "My Modules", icon: BookOpen },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export default function AppLayout() {
  return (
    <SidebarShell navItems={navItems} homeTo="/dashboard" roleLabel="Medical Student" />
  );
}
