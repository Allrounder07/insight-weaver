import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Upload, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="section-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Data<span className="gradient-text">Lens</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/">
            <Button variant={isActive("/") ? "secondary" : "ghost"} size="sm" className="text-sm">
              Home
            </Button>
          </Link>
          <Link to="/upload">
            <Button variant={isActive("/upload") ? "secondary" : "ghost"} size="sm" className="gap-1.5 text-sm">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant={isActive("/dashboard") ? "secondary" : "ghost"} size="sm" className="gap-1.5 text-sm">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          {user ? (
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant={isActive("/auth") ? "secondary" : "ghost"} size="sm" className="gap-1.5 text-sm">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
