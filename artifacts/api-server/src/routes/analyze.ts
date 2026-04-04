import { Router, type IRouter } from "express";
import { db, searchesTable } from "@workspace/db";
import { AnalyzeAccountBody } from "@workspace/api-zod";

const router: IRouter = Router();

function getTier(followers: number): string {
  if (followers < 1_000) return "Nano";
  if (followers < 10_000) return "Micro";
  if (followers < 100_000) return "Mid";
  if (followers < 1_000_000) return "Macro";
  return "Mega";
}

interface MockData {
  username: string;
  score: number;
  followers: number;
  following: number;
  tweets: number;
  likes: number;
  engagementRate: number;
  growthRate: number;
  avgLikes: number;
  avgRetweets: number;
  avgReplies: number;
  tier: string;
  createdAt: string;
}

function simulateXData(username: string): MockData {
  const seed = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const rand = (min: number, max: number): number => {
    const x = Math.sin(seed + min + max) * 10_000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const followers = Math.floor(rand(500, 2_000_000));
  const following = Math.floor(rand(100, Math.min(followers * 0.8, 50_000)));
  const tweets = Math.floor(rand(50, 50_000));
  const likes = Math.floor(rand(1_000, followers * 10));

  const engagementRate = parseFloat(Math.min(rand(0.5, 8), 10).toFixed(2));
  const rawScore = (followers * engagementRate) / 100;
  const score = parseFloat(Math.min(rawScore, 1000).toFixed(1));

  const avgLikes = rand(2, Math.min(followers * 0.05, 50_000));
  const avgRetweets = avgLikes * rand(0.1, 0.3);
  const avgReplies = avgLikes * rand(0.05, 0.15);
  const growthRate = parseFloat(rand(-5, 25).toFixed(2));

  return {
    username,
    score,
    followers,
    following,
    tweets,
    likes,
    engagementRate,
    growthRate,
    avgLikes: parseFloat(avgLikes.toFixed(1)),
    avgRetweets: parseFloat(avgRetweets.toFixed(1)),
    avgReplies: parseFloat(avgReplies.toFixed(1)),
    tier: getTier(followers),
    createdAt: new Date().toISOString(),
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: parsed.error.message });
    return;
  }

  const rawUsername = parsed.data.username.replace(/^@/, "").trim();
  if (!rawUsername) {
    res.status(400).json({ error: "Bad Request", message: "username is required" });
    return;
  }

  await delay(600);

  const data = simulateXData(rawUsername);

  await db.insert(searchesTable).values({
    username: data.username,
    score: data.score,
    followers: data.followers,
    following: data.following,
    tweets: data.tweets,
    engagementRate: data.engagementRate,
    growthRate: data.growthRate,
    avgLikes: data.avgLikes,
    avgRetweets: data.avgRetweets,
    avgReplies: data.avgReplies,
    tier: data.tier,
  });

  res.status(200).json({
    username: data.username,
    score: data.score,
    followers: data.followers,
    following: data.following,
    tweets: data.tweets,
    engagementRate: data.engagementRate,
    growthRate: data.growthRate,
    avgLikes: data.avgLikes,
    avgRetweets: data.avgRetweets,
    avgReplies: data.avgReplies,
    tier: data.tier,
    createdAt: data.createdAt,
  });
});

export default router;
