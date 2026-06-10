import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Users,
  LogOut,
  Menu,
  X,
  Camera,
  KeyRound,
  Image,
} from "lucide-react";
import { useAuthStore } from "../../stores/auth";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Toutes les vidéos", href: "/videos", icon: Camera },
  { name: "Téléverser", href: "/upload", icon: Upload, requireUpload: true },
  { name: "Utilisateurs", href: "/users", icon: Users, requireAdmin: true },
  { name: "Changer le mot de passe", href: "/change-password", icon: KeyRound },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const filteredNav = navigation.filter((item) => {
    if (item.requireAdmin && user?.role !== "admin") return false;
    if (item.requireUpload && user?.role !== "admin" && user?.role !== "uploader") return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const navItems = (onClick?: () => void) =>
    filteredNav.map((item) => (
      <Link
        key={item.name}
        to={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive(item.href)
            ? "gradient-primary text-white shadow-md glow-primary"
            : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-hover)] hover:text-secondary"
        )}
      >
        <item.icon className={cn("h-4 w-4", isActive(item.href) ? "text-white" : "text-secondary")} />
        {item.name}
      </Link>
    ));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border gradient-header backdrop-blur-lg">
        <div className="flex h-14 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-secondary"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg group">
            <div className="h-9 w-9 rounded-xl gradient-gold flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow glow-gold">
              <Camera className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="hidden sm:inline text-secondary font-bold tracking-tight">
              OSS Vidéothèque
            </span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <a
              href="http://192.168.2.128"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 border border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary"
            >
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Photothèque</span>
            </a>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Badge role={user?.role} />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Déconnexion"
              className="text-muted-foreground hover:text-secondary"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Sidebar: Desktop ──────────────────────────────── */}
        <aside className="hidden lg:flex lg:w-60 lg:flex-col bg-[var(--color-sidebar-bg)] border-r border-border">
          <nav className="flex flex-col gap-1 p-3">
            {navItems()}
          </nav>
          <div className="mt-auto p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              OSS Vidéothèque &copy; {new Date().getFullYear()}
            </p>
          </div>
        </aside>

        {/* ── Sidebar: Mobile ───────────────────────────────── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed left-0 top-14 bottom-0 w-60 bg-[var(--color-sidebar-bg)] border-r border-border z-30 shadow-2xl">
              <nav className="flex flex-col gap-1 p-3">
                {navItems(() => setSidebarOpen(false))}
              </nav>
            </aside>
          </div>
        )}

        {/* ── Main Content ──────────────────────────────────── */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border py-3 px-4 text-center text-xs text-muted-foreground mt-auto lg:hidden">
        OSS Vidéothèque &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function Badge({ role }: { role?: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center rounded-full gradient-primary px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full gradient-gold px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground shadow-sm">
      Uploader
    </span>
  );
}
