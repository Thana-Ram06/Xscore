import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useGetSearchById } from "@workspace/api-client-react";
import { ArrowUpRight, ArrowDownRight, Users, MessageCircle, TrendingUp, Twitter, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function SearchDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: record, isLoading, error } = useGetSearchById(Number(id));

  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4" data-testid="link-back">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[300px] md:col-span-2 rounded-2xl" />
            <Skeleton className="h-[300px] rounded-2xl" />
          </div>
        ) : error || !record ? (
          <Card className="rounded-2xl border-destructive/50 bg-destructive/10">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-serif text-destructive mb-2">Record Not Found</h2>
              <p className="text-muted-foreground">Could not load search record #{id}.</p>
              <Link href="/">
                <span className="mt-6 inline-block text-primary hover:underline cursor-pointer">Return Home</span>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 rounded-2xl border-border bg-card/50 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Twitter className="w-64 h-64" />
              </div>
              <CardContent className="p-8 md:p-12 relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20">
                      <span className="text-2xl font-serif">
                        {record.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold font-serif flex items-center gap-3">
                        @{record.username}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                          {record.tier} Influencer
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-2">
                          Searched {formatDistanceToNow(new Date(record.searchedAt))} ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-baseline gap-4 md:gap-8 mt-auto">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">XScore Index</p>
                    <div className="text-7xl md:text-9xl font-serif font-bold text-foreground leading-none tracking-tighter flex items-baseline">
                      <AnimatedCounter value={record.score} className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                      <span className="text-3xl md:text-5xl text-muted-foreground ml-2">/1000</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${record.growthRate >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {record.growthRate >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span>{Math.abs(record.growthRate)}% Growth</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="rounded-2xl flex-1 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center gap-4 h-full">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Followers</p>
                    <p className="text-2xl font-serif font-bold">{record.followers.toLocaleString()}</p>
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
                    <p className="text-2xl font-serif font-bold">{record.engagementRate.toFixed(2)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
