import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useAnalyzeAccount } from "@workspace/api-client-react";
import type { AnalyzeResult } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  BarChart3,
  Zap,
  Target,
  Loader2,
  ArrowRight,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";

function getScoreLabel(score: number): string {
  if (score >= 850) return "Elite";
  if (score >= 650) return "Excellent";
  if (score >= 400) return "Strong";
  if (score >= 200) return "Growing";
  return "Emerging";
}

function getScoreColor(score: number): string {
  if (score >= 850) return "text-primary";
  if (score >= 650) return "text-emerald-400";
  if (score >= 400) return "text-blue-400";
  if (score >= 200) return "text-yellow-400";
  return "text-orange-400";
}

function ResultCard({ data, onViewFull }: { data: AnalyzeResult; onViewFull: () => void }) {
  return (
    <div
      className="w-full max-w-md mt-4 rounded-2xl border border-primary/30 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500"
      data-testid="result-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-base font-semibold shrink-0">
            {data.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">@{data.username}</p>
            <span className="text-xs text-primary font-medium">{data.tier} Influencer</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">XScore</p>
          <p className={`text-2xl font-serif font-bold ${getScoreColor(data.score)}`}>
            {Math.round(data.score)}
            <span className="text-xs text-muted-foreground font-normal">/1000</span>
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border/50">
        <div className="flex flex-col items-center gap-1 px-4 py-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Followers</span>
          </div>
          <p className="text-lg font-serif font-bold">
            {data.followers >= 1_000_000
              ? `${(data.followers / 1_000_000).toFixed(1)}M`
              : data.followers >= 1_000
              ? `${(data.followers / 1_000).toFixed(1)}K`
              : data.followers.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 px-4 py-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Engagement</span>
          </div>
          <p className="text-lg font-serif font-bold">{data.engagementRate.toFixed(2)}%</p>
        </div>

        <div className="flex flex-col items-center gap-1 px-4 py-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Star className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Tier</span>
          </div>
          <p className="text-lg font-serif font-bold">{getScoreLabel(data.score)}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={onViewFull}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          data-testid="button-view-dashboard"
        >
          View Full Report
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const analyzeMutation = useAnalyzeAccount({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
      },
      onError: (error) => {
        toast({
          title: "Analysis Failed",
          description:
            error.message || "Could not analyze this account. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.replace(/^@/, "").trim();
    if (!clean) {
      toast({
        title: "Username required",
        description: "Enter an X username to analyze.",
        variant: "destructive",
      });
      return;
    }
    setResult(null);
    analyzeMutation.mutate({ data: { username: clean } });
  };

  const handleViewFull = () => {
    if (result) setLocation(`/dashboard/${result.username}`);
  };

  const features = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Deep Analytics",
      description:
        "Beyond basic metrics. We analyze engagement quality, growth velocity, and true reach.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Scoring",
      description:
        "Our proprietary algorithm computes an influence score from 0–1000 in milliseconds.",
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Tier Classification",
      description:
        "Automatically categorize accounts from Nano to Mega influencers based on impact.",
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
          AI-powered scoring for influence, trust, and engagement. Drop any
          handle to reveal their true impact.
        </p>

        {/* Input + inline results */}
        <div className="w-full max-w-md flex flex-col items-center">
          <form
            onSubmit={handleAnalyze}
            className="w-full"
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
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (result) setResult(null);
                }}
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

          {/* Loading pulse */}
          {analyzeMutation.isPending && (
            <div className="w-full mt-4 rounded-2xl border border-border bg-card p-6 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {/* Result card */}
          {result && !analyzeMutation.isPending && (
            <ResultCard data={result} onViewFull={handleViewFull} />
          )}
        </div>
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
