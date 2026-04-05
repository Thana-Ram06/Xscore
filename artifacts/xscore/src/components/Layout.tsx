import { Header } from "@/components/Header";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Subtle radial gradient overlay */}
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
          <div className="max-w-6xl mx-auto px-4 text-center text-xs text-muted-foreground tracking-wide">
            XScore AI &copy; {new Date().getFullYear()} &mdash; AI-powered influence analytics
          </div>
        </footer>
      </div>
    </div>
  );
}
