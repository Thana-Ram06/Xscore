import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, History } from "lucide-react";
import { Link, useLocation } from "wouter";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "/logo.png";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, isConfigured } = useAuth();
  const [location] = useLocation();

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
            <img src={logoImg} alt="XScore AI logo" className="h-8 w-8 rounded-md object-contain" />
            <span className="font-serif text-xl font-semibold tracking-tight">XScore <span className="text-primary">AI</span></span>
          </Link>

          {isConfigured && user && (
            <Link
              href="/my-analyses"
              className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-300 ${
                location === "/my-analyses"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              My Analyses
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AuthButton />

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
            data-testid="button-theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
