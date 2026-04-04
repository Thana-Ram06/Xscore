import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useAnalyzeAccount, useGetSearchHistory } from "@workspace/api-client-react";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function getScoreLabel(score: number): string {
  if (score >= 850) return "Elite";
  if (score >= 650) return "Excellent";
  if (score >= 400) return "Strong";
  if (score >= 200) return "Growing";
  return "Emerging";
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

  const { mutate: analyze, data: analyzeData, isPending: isAnalyzing, error } = useAnalyzeAccount();
  const { data: historyData, isLoading: isLoadingHistory } = useGetSearchHistory();

  useEffect(() => {
    if (username) {
      analyze({ data: { username } });
    }
  }, [username, analyze]);

  const recentHistory = historyData?.slice(0, 10) || [];

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
              <p className="text-sm">Analyzing @{username}...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center">
            <h2 className="text-2xl font-serif text-destructive mb-2">Analysis Failed</h2>
            <p className="text-muted-foreground text-sm">Could not fetch data for @{username}.</p>
            <Link href="/" className="mt-6 inline-block text-primary text-sm hover:underline">
              Return home
            </Link>
          </div>
        ) : analyzeData ? (
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
                      <p className="text-xl font-serif font-semibold">@{analyzeData.username}</p>
                      <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                        {analyzeData.tier} Influencer
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                      XScore Index
                    </p>
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex items-baseline gap-1">
                        <AnimatedCounter
                          value={Math.round(analyzeData.score)}
                          className="text-7xl md:text-9xl font-serif font-bold leading-none text-primary"
                        />
                        <span className="text-2xl md:text-4xl text-muted-foreground">/1000</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-base font-serif text-foreground font-medium">
                          {getScoreLabel(analyzeData.score)}
                        </span>
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
                  </div>
                </div>

                {/* Right: quick stats */}
                <div className="md:col-span-2 p-8 flex flex-col justify-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Followers</p>
                    <p className="text-2xl font-serif font-bold">{analyzeData.followers.toLocaleString()}</p>
                  </div>
                  <div className="border-t border-border/50" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Following</p>
                    <p className="text-2xl font-serif font-bold">{analyzeData.following.toLocaleString()}</p>
                  </div>
                  <div className="border-t border-border/50" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Tweets</p>
                    <p className="text-2xl font-serif font-bold">{analyzeData.tweets.toLocaleString()}</p>
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
                value={analyzeData.avgLikes >= 1000
                  ? `${(analyzeData.avgLikes / 1000).toFixed(1)}k`
                  : Math.round(analyzeData.avgLikes).toString()}
                icon={<Heart className="h-4 w-4" />}
                accent="bg-pink-500/10 text-pink-400"
              />
              <StatCard
                label="Avg Retweets"
                value={analyzeData.avgRetweets >= 1000
                  ? `${(analyzeData.avgRetweets / 1000).toFixed(1)}k`
                  : Math.round(analyzeData.avgRetweets).toString()}
                icon={<Repeat2 className="h-4 w-4" />}
                accent="bg-blue-500/10 text-blue-400"
              />
              <StatCard
                label="Avg Replies"
                value={analyzeData.avgReplies >= 1000
                  ? `${(analyzeData.avgReplies / 1000).toFixed(1)}k`
                  : Math.round(analyzeData.avgReplies).toString()}
                icon={<TrendingUp className="h-4 w-4" />}
                accent="bg-orange-500/10 text-orange-400"
              />
            </div>
          </>
        ) : null}

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
              recentHistory.map((record) => (
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
                        {record.followers.toLocaleString()} followers
                      </span>
                      <span className="font-serif text-xl font-bold text-primary" data-testid={`score-${record.id}`}>
                        {Math.round(record.score)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
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
