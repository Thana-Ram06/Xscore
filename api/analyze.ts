import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";

// ─── Database ────────────────────────────────────────────────────────────────

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

async function ensureTable(db: Pool): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS searches (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      score REAL NOT NULL,
      followers INTEGER NOT NULL,
      following INTEGER NOT NULL DEFAULT 0,
      tweets INTEGER NOT NULL DEFAULT 0,
      engagement_rate REAL NOT NULL,
      growth_rate REAL NOT NULL,
      avg_likes REAL NOT NULL DEFAULT 0,
      avg_retweets REAL NOT NULL DEFAULT 0,
      avg_replies REAL NOT NULL DEFAULT 0,
      tier TEXT NOT NULL,
      searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─── Scoring factors (each returns 0–100) ────────────────────────────────────

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
    const penalty = (1 - engagementRate) * 50;
    return Math.max(5, 50 - penalty);
  }
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
 */
function calcGrowthScore(rand: ReturnType<typeof makeRand>): number {
  const pattern = rand(0, 1);
  if (pattern > 0.6) return rand(68, 95);   // Stable, organic
  if (pattern > 0.3) return rand(42, 67);   // Moderate with spikes
  return rand(15, 41);                       // Heavy spikes — penalised
}

/**
 * Activity Score (weight 15%)
 * Derived from estimated tweets per week.
 * Optimal cadence (5–20 / week) scores highest.
 */
function calcActivityScore(tweets: number): number {
  const tweetsPerWeek = tweets / 104; // ~2-year account lifespan
  if (tweetsPerWeek < 0.5) return 15;
  if (tweetsPerWeek < 2)   return 45;
  if (tweetsPerWeek <= 5)  return 72;
  if (tweetsPerWeek <= 20) return 100;
  if (tweetsPerWeek <= 40) return 78;
  if (tweetsPerWeek <= 70) return 55;
  return 30; // Spam territory
}

/**
 * Authority Score (weight 10%)
 * followers / following ratio on a log scale.
 */
function calcAuthorityScore(followers: number, following: number): number {
  if (following === 0) return 100;
  const ratio = followers / following;
  return Math.min((Math.log10(1 + ratio) / Math.log10(101)) * 100, 100);
}

// ─── Main simulator ───────────────────────────────────────────────────────────

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

  // ── Raw metrics ──────────────────────────────────────────────────────────
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

  // ── Sub-scores (0–100) ───────────────────────────────────────────────────
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

  // ── Weighted composite → 0–1000 ──────────────────────────────────────────
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

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed", message: "POST only" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const rawUsername =
    typeof body?.username === "string"
      ? body.username.replace(/^@/, "").trim()
      : "";

  if (!rawUsername) {
    res
      .status(400)
      .json({ error: "Bad Request", message: "username is required" });
    return;
  }

  await delay(600);

  const data = simulateXData(rawUsername);

  try {
    const db = getPool();
    if (db) {
      await ensureTable(db);
      await db.query(
        `INSERT INTO searches
          (username, score, followers, following, tweets,
           engagement_rate, growth_rate, avg_likes, avg_retweets, avg_replies, tier)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          data.username,
          data.score,
          data.followers,
          data.following,
          data.tweets,
          data.engagementRate,
          data.growthRate,
          data.avgLikes,
          data.avgRetweets,
          data.avgReplies,
          data.tier,
        ]
      );
    }
  } catch (err) {
    console.error("DB insert error:", err);
  }

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
}
