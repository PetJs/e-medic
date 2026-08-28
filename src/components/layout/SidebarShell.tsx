import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { LogOut, Menu, Search, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SearchDialog } from "@/components/SearchDialog";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Extra path prefixes (besides `to`) that should also highlight this item. */
  matchPrefixes?: string[];
}

function NavList({
  navItems,
  onNavigate,
}: {
  navItems: NavItem[];
  onNavigate?: () => void;
}) {
  const location = useLocation();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map(({ to, label, icon: Icon, end, matchPrefixes }) => {
        const extraActive = matchPrefixes?.some(
          (p) => location.pathname === p || location.pathname.startsWith(p + "/")
        );
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                (isActive || extraActive) && "text-primary"
              )
            }
          >
            {({ isActive }) => (
              <>
                {(isActive || extraActive) && (
                  <motion.span
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className="relative size-4.5" strokeWidth={2} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function UserMenu({ roleLabel }: { roleLabel: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent">
          <Avatar>
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-body text-xs text-muted-foreground">
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarShell({
  navItems,
  homeTo,
  roleLabel,
}: {
  navItems: NavItem[];
  homeTo: string;
  roleLabel: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 ml-6">
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex items-center justify-between px-5 py-5">
          <Link to={homeTo}>
            <Logo />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label="Search"
            title="Search (Ctrl/Cmd+K)"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" />
          </Button>
        </div>
        <NavList navItems={navItems} />
        <div className="border-t p-3">
          <UserMenu roleLabel={roleLabel} />
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Link to={homeTo}>
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-5" />
          </Button>
          <UserMenuCompact roleLabel={roleLabel} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link to={homeTo} className="px-5 py-5" onClick={() => setMobileOpen(false)}>
            <Logo />
          </Link>
          <NavList navItems={navItems} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="px-4 py-6 sm:px-6 lg:pl-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function UserMenuCompact({ roleLabel }: { roleLabel: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Account menu">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {user?.first_name} {user?.last_name}
          <span className="block font-body text-xs font-normal text-muted-foreground">
            {roleLabel}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
