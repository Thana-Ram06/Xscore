import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useGetSearchById } from "@workspace/api-client-react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  MessageCircle,
  TrendingUp,
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

export default function SearchDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: record, isLoading, error } = useGetSearchById(Number(id));

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

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-12 flex items-center justify-center min-h-[280px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !record ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center">
            <h2 className="text-2xl font-serif text-destructive mb-2">Record Not Found</h2>
            <p className="text-muted-foreground text-sm">Could not load search record #{id}.</p>
            <Link href="/" className="mt-6 inline-block text-primary text-sm hover:underline">
              Return home
            </Link>
          </div>
        ) : (
          <>
            {/* Main score card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Left: score */}
                <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-between gap-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl font-medium shrink-0">
                      {record.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xl font-serif font-semibold">@{record.username}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                          {record.tier} Influencer
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Searched {formatDistanceToNow(new Date(record.searchedAt))} ago
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                      XScore Index
                    </p>
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex items-baseline gap-1">
                        <AnimatedCounter
                          value={Math.round(record.score)}
                          className="text-7xl md:text-9xl font-serif font-bold leading-none text-primary"
                        />
                        <span className="text-2xl md:text-4xl text-muted-foreground">/1000</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-base font-serif text-foreground font-medium">
                          {getScoreLabel(record.score)}
                        </span>
                        <div
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
                            record.growthRate >= 0
                              ? "bg-primary/10 text-primary"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {record.growthRate >= 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {Math.abs(record.growthRate).toFixed(1)}% growth
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: stats */}
                <div className="md:col-span-2 p-8 flex flex-col justify-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Followers</p>
                    <p className="text-2xl font-serif font-bold">{record.followers.toLocaleString()}</p>
                  </div>
                  <div className="border-t border-border/50" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Engagement Rate</p>
                    <p className="text-2xl font-serif font-bold">{record.engagementRate.toFixed(2)}%</p>
                  </div>
                  <div className="border-t border-border/50" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Growth Rate</p>
                    <p className={`text-2xl font-serif font-bold ${record.growthRate >= 0 ? "text-primary" : "text-red-400"}`}>
                      {record.growthRate >= 0 ? "+" : ""}{record.growthRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Followers", value: record.followers.toLocaleString(), icon: <Users className="h-4 w-4" />, accent: "bg-blue-500/10 text-blue-400" },
                { label: "Engagement", value: `${record.engagementRate.toFixed(2)}%`, icon: <MessageCircle className="h-4 w-4" />, accent: "bg-primary/10 text-primary" },
                { label: "Growth", value: `${record.growthRate >= 0 ? "+" : ""}${record.growthRate.toFixed(1)}%`, icon: <TrendingUp className="h-4 w-4" />, accent: "bg-orange-500/10 text-orange-400" },
                { label: "Tier", value: record.tier, icon: <Heart className="h-4 w-4" />, accent: "bg-pink-500/10 text-pink-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 ease-in-out"
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-4 ${stat.accent}`}>
                    {stat.icon}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-serif font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
