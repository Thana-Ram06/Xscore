import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useAnalyzeAccount } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Search, BarChart3, Zap, Target, Loader2 } from "lucide-react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const analyzeMutation = useAnalyzeAccount({
    mutation: {
      onSuccess: (data) => {
        setLocation(`/dashboard/${data.username}`);
      },
      onError: (error) => {
        toast({
          title: "Analysis Failed",
          description: error.message || "Could not analyze this account. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    const cleanUsername = username.replace(/^@/, "").trim();
    analyzeMutation.mutate({ data: { username: cleanUsername } });
  };

  const features = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Deep Analytics",
      description: "Beyond basic metrics. We analyze engagement quality, growth velocity, and true reach.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Scoring",
      description: "Our proprietary algorithm computes an influence score from 0–1000 in milliseconds.",
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Tier Classification",
      description: "Automatically categorize accounts from Nano to Mega influencers based on impact.",
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8 border border-primary/20 tracking-wide uppercase">
          <Zap className="h-3 w-3" />
          <span>AI-Powered Influence Engine</span>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-3xl mb-6">
          Analyze Any{" "}
          <span className="text-primary">X Account</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
          AI-powered scoring for influence, trust, and engagement. Drop any handle to reveal their true impact.
        </p>

        {/* Input container */}
        <form
          onSubmit={handleAnalyze}
          className="w-full max-w-md"
          data-testid="form-analyze"
        >
          <div className="flex items-center gap-0 rounded-xl border border-border bg-card overflow-hidden focus-within:border-primary/50 transition-all duration-300">
            <div className="flex items-center pl-4 text-muted-foreground select-none shrink-0">
              <span className="text-sm font-medium">@</span>
            </div>
            <input
              type="text"
              placeholder="username"
              className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={analyzeMutation.isPending}
              data-testid="input-username"
            />
            <button
              type="submit"
              disabled={analyzeMutation.isPending || !username.trim()}
              className="m-1.5 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              data-testid="button-analyze"
            >
              {analyzeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </form>
      </section>

      {/* Feature cards */}
      <section className="w-full max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 ease-in-out"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                {f.icon}
              </div>
              <h3 className="font-serif text-xl mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
