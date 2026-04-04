import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
          <div className="bg-primary/10 p-1.5 rounded-md group-hover:bg-primary/20 transition-colors duration-300">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight">XScore</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full hover:bg-muted transition-colors duration-300"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
