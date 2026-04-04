import { Header } from "@/components/Header";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0" />
      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-border py-8 mt-auto bg-card/30 backdrop-blur-sm">
          <div className="container max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>XScore &copy; {new Date().getFullYear()}. AI-powered influence analytics.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
