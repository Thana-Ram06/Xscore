import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, Activity } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
          <div className="bg-primary/10 p-1.5 rounded-md group-hover:bg-primary/20 transition-colors duration-300">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">XScore</span>
        </Link>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
          data-testid="button-theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
