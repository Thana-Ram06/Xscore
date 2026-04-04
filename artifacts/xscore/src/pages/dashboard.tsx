import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useAnalyzeAccount, useGetSearchHistory } from "@workspace/api-client-react";
import type { AnalyzeResult } from "@workspace/api-client-react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  MessageCircle,
  TrendingUp,
  History,
  Heart,
  Repeat2,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Extended type that includes breakdown returned by the upgraded API ────────
interface ScoreBreakdown {
  engagement: number;
  followerQuality: number;
  growth: number;
  activity: number;
  authority: number;
}

type AnalyzeResultWithBreakdown = AnalyzeResult & {
  breakdown?: ScoreBreakdown;
  dataSource?: "real" | "mock";
};

function getScoreLabel(score: number): string {
  if (score >= 700) return "Excellent";
  if (score >= 300) return "متوسط";
  return "Low";
}

function getScorePalette(score: number): {
  label: string;
  bar: string;
  badge: string;
  text: string;
} {
  if (score >= 700)
    return {
      label: "text-primary",
      bar: "bg-primary",
      badge: "bg-primary/10 text-primary border-primary/20",
      text: "text-primary",
    };
  if (score >= 300)
    return {
      label: "text-amber-400",
      bar: "bg-amber-400",
      badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      text: "text-amber-400",
    };
  return {
    label: "text-red-400",
    bar: "bg-red-400",
    badge: "bg-red-400/10 text-red-400 border-red-400/20",
    text: "text-red-400",
  };
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── Breakdown bar ─────────────────────────────────────────────────────────────
function BreakdownBar({
  label,
  score,
  weight,
  color,
}: {
  label: string;
  score: number;
  weight: string;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{weight}</span>
          <span className={`font-semibold tabular-nums ${color}`}>
            {score.toFixed(1)}
            <span className="text-muted-foreground font-normal">/100</span>
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ScoreBreakdownPanel({ breakdown }: { breakdown: ScoreBreakdown }) {
  const factors = [
    { label: "Engagement",      key: "engagement"      as const, weight: "35%", color: "text-primary"     },
    { label: "Follower Quality", key: "followerQuality" as const, weight: "25%", color: "text-violet-400"  },
    { label: "Growth",           key: "growth"          as const, weight: "15%", color: "text-emerald-400" },
    { label: "Activity",         key: "activity"        as const, weight: "15%", color: "text-amber-400"   },
    { label: "Authority",        key: "authority"       as const, weight: "10%", color: "text-blue-400"    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-lg">Score Breakdown</h3>
        <span className="text-xs text-muted-foreground">Multi-factor analysis</span>
      </div>
      {factors.map((f) => (
        <BreakdownBar
          key={f.key}
          label={f.label}
          score={breakdown[f.key]}
          weight={f.weight}
          color={f.color}
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 ease-in-out">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-4 ${accent}`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-serif font-bold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { username } = useParams<{ username: string }>();

  const {
    mutate: analyze,
    data: _analyzeData,
    isPending: isAnalyzing,
    error,
  } = useAnalyzeAccount();

  // Cast to extended type that includes breakdown from the upgraded API
  const analyzeData = _analyzeData as AnalyzeResultWithBreakdown | undefined;

  const { data: historyData, isLoading: isLoadingHistory } = useGetSearchHistory();

  useEffect(() => {
    if (username) {
      analyze({ data: { username } });
    }
  }, [username, analyze]);

  const recentHistory = historyData?.slice(0, 10) || [];
  const palette = analyzeData ? getScorePalette(analyzeData.score) : null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto w-full px-4 py-10 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4" />
          New analysis
        </Link>

        {/* Score card */}
        {isAnalyzing ? (
          <div className="rounded-2xl border border-border bg-card p-12 flex items-center justify-center min-h-[280px]">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Analyzing @{username}…</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-12 flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-10 w-10 text-destructive/70" />
            <div>
              <h2 className="text-2xl font-serif text-destructive mb-1">Analysis Failed</h2>
              <p className="text-muted-foreground text-sm">
                Could not fetch data for @{username}. Please try again.
              </p>
            </div>
            <Link
              href="/"
              className="mt-2 px-5 py-2 rounded-lg border border-border text-sm hover:border-primary/50 transition-colors duration-200"
            >
              Return home
            </Link>
          </div>
        ) : !analyzeData ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground text-sm">No data available. Try a new search.</p>
            <Link href="/" className="mt-4 inline-block text-primary text-sm hover:underline">
              Search an account
            </Link>
          </div>
        ) : (
          <>
            {/* Main score card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Left: score */}
                <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-between gap-8">
                  {/* Username & tier */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl font-medium shrink-0">
                      {analyzeData.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xl font-serif font-semibold">@{analyzeData.username}</p>
                        {analyzeData.dataSource === "mock" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            Simulated
                          </span>
                        )}
                        {analyzeData.dataSource === "real" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                            Live data
                          </span>
                        )}
                      </div>
                      <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                        {analyzeData.tier} Influencer
                      </span>
                    </div>
                  </div>

                  {/* Score + label */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                      XScore Index
                    </p>
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex items-baseline gap-1">
                        <AnimatedCounter
                          value={Math.round(analyzeData.score)}
                          className={`text-7xl md:text-9xl font-serif font-bold leading-none ${palette!.label}`}
                        />
                        <span className="text-2xl md:text-4xl text-muted-foreground">/1000</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {/* Tier label badge */}
                        <span
                          className={`inline-flex items-center text-sm font-semibold px-3 py-1 rounded-full border ${palette!.badge}`}
                          data-testid="score-label"
                        >
                          {getScoreLabel(analyzeData.score)}
                        </span>
                        {/* Growth rate */}
                        <div
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
                            analyzeData.growthRate >= 0
                              ? "bg-primary/10 text-primary"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {analyzeData.growthRate >= 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {Math.abs(analyzeData.growthRate).toFixed(1)}% growth
                        </div>
                      </div>
                    </div>

                    {/* Score progress bar */}
                    <div className="mt-5 h-1.5 w-full max-w-xs rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${palette!.bar}`}
                        style={{ width: `${(analyzeData.score / 1000) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {Math.round(analyzeData.score)} / 1000 points
                    </p>
                  </div>
                </div>

                {/* Right: quick stats */}
                <div className="md:col-span-2 p-8 flex flex-col justify-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Followers
                    </p>
                    <p className="text-2xl font-serif font-bold" data-testid="stat-followers">
                      {formatNum(analyzeData.followers)}
                    </p>
                  </div>
                  <div className="border-t border-border/50" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Following
                    </p>
                    <p className="text-2xl font-serif font-bold">
                      {formatNum(analyzeData.following)}
                    </p>
                  </div>
                  <div className="border-t border-border/50" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Total Tweets
                    </p>
                    <p className="text-2xl font-serif font-bold">
                      {formatNum(analyzeData.tweets)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Engagement Rate"
                value={`${analyzeData.engagementRate.toFixed(2)}%`}
                icon={<MessageCircle className="h-4 w-4" />}
                accent="bg-primary/10 text-primary"
              />
              <StatCard
                label="Avg Likes"
                value={formatNum(Math.round(analyzeData.avgLikes))}
                icon={<Heart className="h-4 w-4" />}
                accent="bg-pink-500/10 text-pink-400"
              />
              <StatCard
                label="Avg Retweets"
                value={formatNum(Math.round(analyzeData.avgRetweets))}
                icon={<Repeat2 className="h-4 w-4" />}
                accent="bg-blue-500/10 text-blue-400"
              />
              <StatCard
                label="Avg Replies"
                value={formatNum(Math.round(analyzeData.avgReplies))}
                icon={<TrendingUp className="h-4 w-4" />}
                accent="bg-orange-500/10 text-orange-400"
              />
            </div>

            {/* Score breakdown */}
            {analyzeData.breakdown && (
              <ScoreBreakdownPanel breakdown={analyzeData.breakdown} />
            )}
          </>
        )}

        {/* Search history */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-serif text-xl">Recent Analyses</h3>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50">
            {isLoadingHistory ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-12 bg-muted rounded" />
                </div>
              ))
            ) : recentHistory.length > 0 ? (
              recentHistory.map((record) => {
                const rp = getScorePalette(record.score);
                return (
                  <Link href={`/search/${record.id}`} key={record.id}>
                    <div
                      className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors duration-200 cursor-pointer group"
                      data-testid={`history-item-${record.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-base font-medium group-hover:bg-primary/20 transition-colors duration-200">
                          {record.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">@{record.username}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{record.tier}</span>
                            <span>&middot;</span>
                            <span>{formatDistanceToNow(new Date(record.searchedAt))} ago</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatNum(record.followers)} followers
                        </span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={`font-serif text-xl font-bold ${rp.text}`}
                            data-testid={`score-${record.id}`}
                          >
                            {Math.round(record.score)}
                          </span>
                          <span className={`text-[10px] font-medium ${rp.text} opacity-80`}>
                            {getScoreLabel(record.score)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No previous searches found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
