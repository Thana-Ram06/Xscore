import { Router, type IRouter } from "express";
import { db, searchesTable } from "@workspace/db";
import {
  AnalyzeAccountBody,
  AnalyzeAccountResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getTier(followers: number): string {
  if (followers < 1000) return "Nano";
  if (followers < 10000) return "Micro";
  if (followers < 100000) return "Mid";
  if (followers < 1000000) return "Macro";
  return "Mega";
}

function generateMockData(username: string) {
  const seed = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = (min: number, max: number) => {
    const x = Math.sin(seed + min + max) * 10000;
    return min + ((x - Math.floor(x)) * (max - min));
  };

  const followers = Math.floor(rand(500, 2000000));
  const following = Math.floor(rand(100, Math.min(followers * 0.8, 50000)));
  const tweets = Math.floor(rand(50, 50000));
  const avgLikes = rand(2, Math.min(followers * 0.05, 50000));
  const avgRetweets = avgLikes * rand(0.1, 0.3);
  const avgReplies = avgLikes * rand(0.05, 0.15);
  const engagementRate = parseFloat(((avgLikes + avgRetweets + avgReplies) / followers * 100).toFixed(2));
  const growthRate = parseFloat((rand(-5, 25)).toFixed(2));
  const score = parseFloat(Math.min(1000, (followers * engagementRate) / 100).toFixed(1));
  const tier = getTier(followers);

  return {
    username,
    score,
    followers,
    following,
    tweets,
    engagementRate,
    growthRate,
    avgLikes: parseFloat(avgLikes.toFixed(1)),
    avgRetweets: parseFloat(avgRetweets.toFixed(1)),
    avgReplies: parseFloat(avgReplies.toFixed(1)),
    tier,
    createdAt: new Date().toISOString(),
  };
}

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: parsed.error.message });
    return;
  }

  const rawUsername = parsed.data.username.replace(/^@/, "").trim();

  if (!rawUsername) {
    res.status(400).json({ error: "Bad Request", message: "Username is required" });
    return;
  }

  const mockData = generateMockData(rawUsername);

  await db.insert(searchesTable).values({
    username: mockData.username,
    score: mockData.score,
    followers: mockData.followers,
    following: mockData.following,
    tweets: mockData.tweets,
    engagementRate: mockData.engagementRate,
    growthRate: mockData.growthRate,
    avgLikes: mockData.avgLikes,
    avgRetweets: mockData.avgRetweets,
    avgReplies: mockData.avgReplies,
    tier: mockData.tier,
  });

  res.json(AnalyzeAccountResponse.parse(mockData));
});

export default router;
