import { Header } from "@/components/Header";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(142 71% 45% / 0.07) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-border/50 py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-3">
            <a
              href="https://x.com/anoinv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-8 w-8 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors duration-200"
              aria-label="Follow on X"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-foreground/70" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <p className="text-xs text-muted-foreground tracking-wide">
              XScore AI &copy; {new Date().getFullYear()} &mdash; AI-powered influence analytics
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
