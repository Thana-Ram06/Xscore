import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAnalyzeAccount } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Search, BarChart3, Zap, Target } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 w-full max-w-5xl mx-auto">
        <div className="text-center space-y-6 mb-12 max-w-2xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
            <Zap className="h-4 w-4" />
            <span>AI-Powered Influence Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif leading-tight">
            Quantify Your <span className="text-primary">Influence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-sans max-w-xl mx-auto">
            The elite analytics terminal for power users. Drop an X handle to see their true global impact score.
          </p>
          
          <form onSubmit={handleAnalyze} className="mt-8 relative max-w-md mx-auto w-full flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground font-medium">@</span>
              </div>
              <Input
                type="text"
                placeholder="username"
                className="pl-8 h-12 text-lg rounded-xl border-border bg-card shadow-sm hover:border-primary/50 focus-visible:ring-primary focus-visible:border-primary transition-all duration-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={analyzeMutation.isPending}
                data-testid="input-username"
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="h-12 px-8 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={analyzeMutation.isPending || !username.trim()}
              data-testid="button-analyze"
            >
              {analyzeMutation.isPending ? (
                <Spinner className="h-5 w-5 mr-2" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              Analyze
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">Deep Analytics</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Beyond basic metrics. We analyze engagement quality, growth velocity, and true reach.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">Instant Scoring</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our proprietary algorithm computes an influence score from 0-1000 in milliseconds.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">Tier Classification</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Automatically categorize accounts from Nano to Mega influencers based on impact.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
