import { Router, type IRouter } from "express";
import { db, searchesTable } from "@workspace/db";
import { AnalyzeAccountBody } from "@workspace/api-zod";

const router: IRouter = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTier(followers: number): string {
  if (followers < 1_000) return "Nano";
  if (followers < 10_000) return "Micro";
  if (followers < 100_000) return "Mid";
  if (followers < 1_000_000) return "Macro";
  return "Mega";
}

/** Seeded pseudo-random deterministic number in [min, max) */
function makeRand(seed: number) {
  return (min: number, max: number): number => {
    const x = Math.sin(seed + min + max) * 10_000;
    return min + (x - Math.floor(x)) * (max - min);
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Scoring factors (each returns 0–100) ───────────────────────────────────

/**
 * Engagement Score (weight 35%)
 * Based on (avgLikes + avgReplies) / followers * 100.
 * Ceiling at 8% engagement = 100 points.
 */
function calcEngagementScore(
  avgLikes: number,
  avgReplies: number,
  followers: number
): number {
  if (followers === 0) return 0;
  const rate = ((avgLikes + avgReplies) / followers) * 100;
  return Math.min((rate / 8) * 100, 100);
}

/**
 * Follower Quality Score (weight 25%)
 * Penalises large accounts with suspiciously low engagement
 * (>10 K followers yet <1% ER → likely inflated audience).
 */
function calcFollowerQualityScore(
  followers: number,
  engagementRate: number
): number {
  if (followers > 10_000 && engagementRate < 1) {
    // Penalty zone – scale by how far below 1% the rate is
    const penalty = (1 - engagementRate) * 50;
    return Math.max(5, 50 - penalty);
  }
  // Reward genuine engagement scaled by audience size
  const sizeBonus = Math.min(
    (Math.log10(Math.max(followers, 1)) / Math.log10(2_000_000)) * 30,
    30
  );
  const erBonus = Math.min((engagementRate / 8) * 70, 70);
  return Math.min(sizeBonus + erBonus, 100);
}

/**
 * Growth Score (weight 15%)
 * Simulates steady organic growth vs artificial spikes.
 * Stability is rewarded; erratic spikes are penalised.
 */
function calcGrowthScore(rand: ReturnType<typeof makeRand>): number {
  const pattern = rand(0, 1);
  if (pattern > 0.6) {
    // Stable, consistent growth
    return rand(68, 95);
  } else if (pattern > 0.3) {
    // Moderate with occasional spikes
    return rand(42, 67);
  }
  // Heavy spikes – penalised
  return rand(15, 41);
}

/**
 * Activity Score (weight 15%)
 * Derived from estimated tweets per week.
 * Optimal cadence (5–20 / week) scores highest.
 * Under-posting and spam-level posting both reduce the score.
 */
function calcActivityScore(tweets: number): number {
  // Assume a typical account lifespan of ~104 weeks (2 years)
  const tweetsPerWeek = tweets / 104;

  if (tweetsPerWeek < 0.5) return 15; // Nearly inactive
  if (tweetsPerWeek < 2) return 45;
  if (tweetsPerWeek <= 5) return 72;
  if (tweetsPerWeek <= 20) return 100; // Sweet spot
  if (tweetsPerWeek <= 40) return 78;
  if (tweetsPerWeek <= 70) return 55;
  return 30; // Spam territory
}

/**
 * Authority Score (weight 10%)
 * followers / following ratio — a high ratio signals organic authority.
 * Uses log scale so the score doesn't collapse for mid-tier accounts.
 */
function calcAuthorityScore(followers: number, following: number): number {
  if (following === 0) return 100;
  const ratio = followers / following;
  // log10(1+ratio) / log10(101) maps [0,∞) → [0,1] with ratio=100 → 1.0
  return Math.min((Math.log10(1 + ratio) / Math.log10(101)) * 100, 100);
}

// ─── Main simulator ─────────────────────────────────────────────────────────

interface ScoreBreakdown {
  engagement: number;
  followerQuality: number;
  growth: number;
  activity: number;
  authority: number;
}

interface MockData {
  username: string;
  score: number;
  followers: number;
  following: number;
  tweets: number;
  engagementRate: number;
  growthRate: number;
  avgLikes: number;
  avgRetweets: number;
  avgReplies: number;
  tier: string;
  createdAt: string;
  breakdown: ScoreBreakdown;
}

function simulateXData(username: string): MockData {
  const seed = username
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = makeRand(seed);

  // ── Raw account metrics ──────────────────────────────────────────────────
  const followers = Math.floor(rand(500, 2_000_000));
  const following = Math.floor(rand(100, Math.min(followers * 0.8, 50_000)));
  const tweets = Math.floor(rand(50, 50_000));

  const avgLikes = rand(2, Math.min(followers * 0.08, 50_000));
  const avgReplies = avgLikes * rand(0.05, 0.15);
  const avgRetweets = avgLikes * rand(0.1, 0.3);

  const engagementRate = parseFloat(
    Math.min(((avgLikes + avgReplies) / followers) * 100, 15).toFixed(2)
  );
  const growthRate = parseFloat(rand(-5, 25).toFixed(2));

  // ── Sub-scores (0–100 each) ──────────────────────────────────────────────
  const engagement = parseFloat(
    calcEngagementScore(avgLikes, avgReplies, followers).toFixed(1)
  );
  const followerQuality = parseFloat(
    calcFollowerQualityScore(followers, engagementRate).toFixed(1)
  );
  const growth = parseFloat(calcGrowthScore(rand).toFixed(1));
  const activity = parseFloat(calcActivityScore(tweets).toFixed(1));
  const authority = parseFloat(
    calcAuthorityScore(followers, following).toFixed(1)
  );

  // ── Weighted composite (→ 0–1000) ────────────────────────────────────────
  const weightedRaw =
    engagement * 0.35 +
    followerQuality * 0.25 +
    growth * 0.15 +
    activity * 0.15 +
    authority * 0.10;

  const score = parseFloat(
    Math.min(Math.max(weightedRaw * 10, 0), 1000).toFixed(1)
  );

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
    tier: getTier(followers),
    createdAt: new Date().toISOString(),
    breakdown: { engagement, followerQuality, growth, activity, authority },
  };
}

// ─── Route ──────────────────────────────────────────────────────────────────

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Bad Request", message: parsed.error.message });
    return;
  }

  const rawUsername = parsed.data.username.replace(/^@/, "").trim();
  if (!rawUsername) {
    res
      .status(400)
      .json({ error: "Bad Request", message: "username is required" });
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
    followers: data.followers,
    following: data.following,
    tweets: data.tweets,
    engagementRate: data.engagementRate,
    score: data.score,
    growthRate: data.growthRate,
    avgLikes: data.avgLikes,
    avgRetweets: data.avgRetweets,
    avgReplies: data.avgReplies,
    tier: data.tier,
    createdAt: data.createdAt,
    breakdown: data.breakdown,
  });
});

export default router;
