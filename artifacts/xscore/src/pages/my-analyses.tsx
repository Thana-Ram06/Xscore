import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { History, TrendingUp, Users, LogIn, Loader2 } from "lucide-react";

interface SearchRecord {
  id: number;
  username: string;
  score: number;
  followers: number;
  engagementRate: number;
  growthRate: number;
  tier: string;
  searchedAt: string;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getScoreColor(score: number) {
  if (score >= 700) return "text-primary";
  if (score >= 300) return "text-amber-400";
  return "text-red-400";
}

function getScoreLabel(score: number) {
  if (score >= 700) return "Excellent";
  if (score >= 300) return "Average";
  return "Low";
}

async function fetchMyAnalyses(userId: string): Promise<SearchRecord[]> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/api/searches?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to load analyses");
  return res.json();
}

export default function MyAnalyses() {
  const { user, loading: authLoading, isConfigured, signIn } = useAuth();
  const [, navigate] = useLocation();

  const { data: analyses, isLoading } = useQuery<SearchRecord[]>({
    queryKey: ["my-analyses", user?.uid],
    queryFn: () => fetchMyAnalyses(user!.uid),
    enabled: !!user,
  });

  if (!isConfigured) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-24 text-center">
          <p className="text-muted-foreground">Authentication is not configured yet.</p>
        </div>
      </Layout>
    );
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-24 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-2">Sign in to view your analyses</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Your personal analysis history is saved when you're signed in with Google.
          </p>
          <button
            onClick={signIn}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Sign in with Google
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-semibold">My Analyses</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{user.displayName ?? user.email}</span>
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!analyses || analyses.length === 0) && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium mb-1">No analyses yet</p>
            <p className="text-sm text-muted-foreground mb-5">
              Search for an X account on the home page to get started.
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Analyze an account
            </button>
          </div>
        )}

        {/* Analyses grid */}
        {!isLoading && analyses && analyses.length > 0 && (
          <div className="grid gap-3">
            {analyses.map((item) => {
              const scoreColor = getScoreColor(item.score);
              const label = getScoreLabel(item.score);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/dashboard/${item.username}`)}
                  className="w-full text-left rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif font-semibold text-sm shrink-0">
                        {item.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">@{item.username}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {formatNum(item.followers)} followers
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            {item.engagementRate.toFixed(2)}% ER
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.searchedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-serif font-bold ${scoreColor}`}>
                        {Math.round(item.score)}
                      </p>
                      <p className={`text-xs font-medium ${scoreColor}`}>{label}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
