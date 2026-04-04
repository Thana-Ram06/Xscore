import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";

// ─── Database ─────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const RAPIDAPI_HOST = "twitter-api45.p.rapidapi.com";
const API_TIMEOUT_MS = 8_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TwitterProfile {
  username: string;
  followers: number;
  following: number;
  tweets: number;
  avgLikes: number;
  avgReplies: number;
  avgRetweets: number;
  isReal: boolean;
}

interface ScoreBreakdown {
  engagement: number;
  followerQuality: number;
  growth: number;
  activity: number;
  authority: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTier(followers: number): string {
  if (followers < 1_000) return "Nano";
  if (followers < 10_000) return "Micro";
  if (followers < 100_000) return "Mid";
  if (followers < 1_000_000) return "Macro";
  return "Mega";
}

function makeRand(seed: number) {
  return (min: number, max: number): number => {
    const x = Math.sin(seed + min + max) * 10_000;
    return min + (x - Math.floor(x)) * (max - min);
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Scoring factors (each 0–100) ────────────────────────────────────────────

function calcEngagementScore(avgLikes: number, avgReplies: number, followers: number): number {
  if (followers === 0) return 0;
  const rate = ((avgLikes + avgReplies) / followers) * 100;
  return Math.min((rate / 8) * 100, 100);
}

function calcFollowerQualityScore(followers: number, engagementRate: number): number {
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

function calcGrowthScore(rand: ReturnType<typeof makeRand>): number {
  const pattern = rand(0, 1);
  if (pattern > 0.6) return rand(68, 95);
  if (pattern > 0.3) return rand(42, 67);
  return rand(15, 41);
}

function calcActivityScore(tweets: number): number {
  const tpw = tweets / 104;
  if (tpw < 0.5) return 15;
  if (tpw < 2)   return 45;
  if (tpw <= 5)  return 72;
  if (tpw <= 20) return 100;
  if (tpw <= 40) return 78;
  if (tpw <= 70) return 55;
  return 30;
}

function calcAuthorityScore(followers: number, following: number): number {
  if (following === 0) return 100;
  const ratio = followers / following;
  return Math.min((Math.log10(1 + ratio) / Math.log10(101)) * 100, 100);
}

function buildScore(profile: TwitterProfile, rand: ReturnType<typeof makeRand>) {
  const engagementRate = parseFloat(
    Math.min(
      ((profile.avgLikes + profile.avgReplies) / Math.max(profile.followers, 1)) * 100,
      15
    ).toFixed(2)
  );

  const breakdown: ScoreBreakdown = {
    engagement:      parseFloat(calcEngagementScore(profile.avgLikes, profile.avgReplies, profile.followers).toFixed(1)),
    followerQuality: parseFloat(calcFollowerQualityScore(profile.followers, engagementRate).toFixed(1)),
    growth:          parseFloat(calcGrowthScore(rand).toFixed(1)),
    activity:        parseFloat(calcActivityScore(profile.tweets).toFixed(1)),
    authority:       parseFloat(calcAuthorityScore(profile.followers, profile.following).toFixed(1)),
  };

  const weightedRaw =
    breakdown.engagement      * 0.35 +
    breakdown.followerQuality * 0.25 +
    breakdown.growth          * 0.15 +
    breakdown.activity        * 0.15 +
    breakdown.authority       * 0.10;

  const score = parseFloat(Math.min(Math.max(weightedRaw * 10, 0), 1000).toFixed(1));

  return { score, engagementRate, breakdown };
}

// ─── Mock data (deterministic fallback) ──────────────────────────────────────

function mockProfile(username: string): TwitterProfile {
  const seed = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = makeRand(seed);

  const followers   = Math.floor(rand(500, 2_000_000));
  const following   = Math.floor(rand(100, Math.min(followers * 0.8, 50_000)));
  const tweets      = Math.floor(rand(50, 50_000));
  const avgLikes    = rand(2, Math.min(followers * 0.08, 50_000));
  const avgReplies  = avgLikes * rand(0.05, 0.15);
  const avgRetweets = avgLikes * rand(0.1, 0.3);

  return { username, followers, following, tweets, avgLikes, avgReplies, avgRetweets, isReal: false };
}

// ─── Real Twitter data via RapidAPI ──────────────────────────────────────────

class TwitterApiError extends Error {
  constructor(
    public readonly code: "USER_NOT_FOUND" | "RATE_LIMIT" | "API_ERROR",
    message: string
  ) {
    super(message);
    this.name = "TwitterApiError";
  }
}

async function fetchTwitterProfile(username: string): Promise<TwitterProfile> {
  const apiKey = process.env.TWITTER_API_KEY;
  if (!apiKey) throw new Error("TWITTER_API_KEY not set");

  const headers = {
    "X-RapidAPI-Key":  apiKey,
    "X-RapidAPI-Host": RAPIDAPI_HOST,
  };

  // ── User profile via twitter-api45 ───────────────────────────────────────
  // Endpoint: GET /screenname.php?screenname=<username>
  const userRes = await fetch(
    `https://${RAPIDAPI_HOST}/screenname.php?screenname=${encodeURIComponent(username)}`,
    { headers, signal: AbortSignal.timeout(API_TIMEOUT_MS) }
  );

  if (userRes.status === 404) throw new TwitterApiError("USER_NOT_FOUND", `@${username} not found on X`);
  if (userRes.status === 429) throw new TwitterApiError("RATE_LIMIT", "X API rate limit reached");
  if (!userRes.ok)            throw new TwitterApiError("API_ERROR", `Twitter API ${userRes.status}`);

  const user = await userRes.json();

  // twitter-api45 field names
  const followers        = Number(user.followers_count ?? user.follower_count  ?? 0);
  const following        = Number(user.friends_count   ?? user.following_count ?? 0);
  const tweets           = Number(user.statuses_count  ?? user.tweet_count     ?? 0);
  const resolvedUsername = (user.screen_name ?? user.username ?? username) as string;

  // ── Recent tweets for engagement ──────────────────────────────────────────
  let avgLikes = 0, avgReplies = 0, avgRetweets = 0;

  try {
    // twitter-api45: GET /timeline.php?screenname=<username>&limit=10
    const tweetsRes = await fetch(
      `https://${RAPIDAPI_HOST}/timeline.php?screenname=${encodeURIComponent(username)}&limit=10`,
      { headers, signal: AbortSignal.timeout(API_TIMEOUT_MS) }
    );

    if (tweetsRes.ok) {
      const data = await tweetsRes.json();
      const list: Record<string, number>[] = Array.isArray(data)
        ? data
        : (data.timeline ?? data.results ?? data.data ?? []);

      if (list.length > 0) {
        const avg = (k1: string, k2 = "") =>
          list.reduce((s, t) => s + (Number(t[k1]) || Number(t[k2]) || 0), 0) / list.length;

        avgLikes    = avg("favorite_count", "likes");
        avgReplies  = avg("reply_count",    "replies");
        avgRetweets = avg("retweet_count",  "retweets");
      }
    }
  } catch {
    // Tweets fetch failed — engagement stays at zero, scoring degrades gracefully
  }

  return { username: resolvedUsername, followers, following, tweets, avgLikes, avgReplies, avgRetweets, isReal: true };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed", message: "POST only" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const rawUsername =
    typeof body?.username === "string" ? body.username.replace(/^@/, "").trim() : "";

  if (!rawUsername) {
    res.status(400).json({ error: "Bad Request", message: "username is required" });
    return;
  }

  // ── Fetch real data, fall back to mock ───────────────────────────────────
  let profile: TwitterProfile;
  let dataSource: "real" | "mock" = "real";

  try {
    profile = await fetchTwitterProfile(rawUsername);
  } catch (err) {
    if (err instanceof TwitterApiError) {
      if (err.code === "USER_NOT_FOUND") {
        res.status(404).json({ error: "Not Found", message: err.message });
        return;
      }
      if (err.code === "RATE_LIMIT") {
        res.status(429).json({ error: "Rate Limited", message: "X API rate limit reached. Try again shortly." });
        return;
      }
    }
    dataSource = "mock";
    profile = mockProfile(rawUsername);
    await delay(600);
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  const seed = rawUsername.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = makeRand(seed);
  const growthRate = parseFloat(rand(-5, 25).toFixed(2));

  const { score, engagementRate, breakdown } = buildScore(profile, rand);

  // ── Persist ───────────────────────────────────────────────────────────────
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
          profile.username, score, profile.followers, profile.following, profile.tweets,
          engagementRate, growthRate,
          parseFloat(profile.avgLikes.toFixed(1)),
          parseFloat(profile.avgRetweets.toFixed(1)),
          parseFloat(profile.avgReplies.toFixed(1)),
          getTier(profile.followers),
        ]
      );
    }
  } catch (dbErr) {
    console.error("DB insert error:", dbErr);
  }

  res.status(200).json({
    username:       profile.username,
    followers:      profile.followers,
    following:      profile.following,
    tweets:         profile.tweets,
    engagementRate,
    score,
    growthRate,
    avgLikes:       parseFloat(profile.avgLikes.toFixed(1)),
    avgRetweets:    parseFloat(profile.avgRetweets.toFixed(1)),
    avgReplies:     parseFloat(profile.avgReplies.toFixed(1)),
    tier:           getTier(profile.followers),
    createdAt:      new Date().toISOString(),
    dataSource,
    breakdown,
  });
}
