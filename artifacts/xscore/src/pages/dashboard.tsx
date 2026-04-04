import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useAnalyzeAccount, useGetSearchHistory } from "@workspace/api-client-react";
import { ArrowUpRight, ArrowDownRight, Users, MessageCircle, TrendingUp, History, Twitter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

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
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Header & Main Score */}
        {isAnalyzing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[300px] md:col-span-2 rounded-2xl" />
            <Skeleton className="h-[300px] rounded-2xl" />
          </div>
        ) : error ? (
          <Card className="rounded-2xl border-destructive/50 bg-destructive/10">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-serif text-destructive mb-2">Analysis Failed</h2>
              <p className="text-muted-foreground">Could not fetch data for @{username}. They might not exist or be private.</p>
              <Link href="/">
                <span className="mt-6 inline-block text-primary hover:underline cursor-pointer">Return Home</span>
              </Link>
            </CardContent>
          </Card>
        ) : analyzeData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <Card className="md:col-span-2 rounded-2xl border-border bg-card/50 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Twitter className="w-64 h-64" />
              </div>
              <CardContent className="p-8 md:p-12 relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20">
                      <span className="text-2xl font-serif">
                        {analyzeData.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold font-serif flex items-center gap-3">
                        @{analyzeData.username}
                      </h2>
                      <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        {analyzeData.tier} Influencer
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-baseline gap-4 md:gap-8 mt-auto">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">XScore Index</p>
                    <div className="text-7xl md:text-9xl font-serif font-bold text-foreground leading-none tracking-tighter flex items-baseline">
                      <AnimatedCounter value={analyzeData.score} className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                      <span className="text-3xl md:text-5xl text-muted-foreground ml-2">/1000</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${analyzeData.growthRate >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {analyzeData.growthRate >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span>{Math.abs(analyzeData.growthRate)}% Growth</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="flex flex-col gap-4">
              <Card className="rounded-2xl flex-1 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center gap-4 h-full">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Followers</p>
                    <p className="text-2xl font-serif font-bold">{analyzeData.followers.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl flex-1 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center gap-4 h-full">
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Engagement</p>
                    <p className="text-2xl font-serif font-bold">{analyzeData.engagementRate.toFixed(2)}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl flex-1 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center gap-4 h-full">
                  <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Likes</p>
                    <p className="text-2xl font-serif font-bold">{analyzeData.avgLikes.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {/* History Section */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-2xl font-serif">Recent Analyses</h3>
          </div>

          <Card className="rounded-2xl border-border bg-card/50 backdrop-blur-sm">
            <div className="divide-y divide-border/50">
              {isLoadingHistory ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
              ) : recentHistory.length > 0 ? (
                recentHistory.map((record) => (
                  <Link href={`/search/${record.id}`} key={record.id}>
                    <div className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between cursor-pointer group" data-testid={`history-item-${record.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-lg font-medium group-hover:scale-110 transition-transform">
                          {record.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold font-serif text-lg">@{record.username}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDistanceToNow(new Date(record.searchedAt))} ago</span>
                            <span>&bull;</span>
                            <span>{record.tier}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-2xl font-bold text-primary">{record.score}</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No previous searches found.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
