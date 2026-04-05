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
      searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_id TEXT,
      user_email TEXT
    )
  `);
  await db.query(`ALTER TABLE searches ADD COLUMN IF NOT EXISTS user_id TEXT`);
  await db.query(`ALTER TABLE searches ADD COLUMN IF NOT EXISTS user_email TEXT`);
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

// ─── Scoring factors (each 0–100, all derived from real data) ────────────────

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

/** Growth estimated from real engagement + follower reach signals (no randomness) */
function calcGrowthScore(followers: number, engagementRate: number): number {
  const engagementSignal = Math.min((engagementRate / 5) * 60, 60);
  const followerSignal   = Math.min(
    (Math.log10(Math.max(followers, 1)) / Math.log10(1_000_000)) * 40,
    40
  );
  return parseFloat((engagementSignal + followerSignal).toFixed(1));
}

function calcActivityScore(tweets: number): number {
  const tpw = tweets / 104;
  if (tpw < 0.5)  return 15;
  if (tpw < 2)    return 45;
  if (tpw <= 5)   return 72;
  if (tpw <= 20)  return 100;
  if (tpw <= 40)  return 78;
  if (tpw <= 70)  return 55;
  return 30;
}

function calcAuthorityScore(followers: number, following: number): number {
  if (following === 0) return 100;
  const ratio = followers / following;
  return Math.min((Math.log10(1 + ratio) / Math.log10(101)) * 100, 100);
}

function buildScore(profile: TwitterProfile) {
  const engagementRate = parseFloat(
    Math.min(
      ((profile.avgLikes + profile.avgReplies) / Math.max(profile.followers, 1)) * 100,
      15
    ).toFixed(2)
  );

  const breakdown: ScoreBreakdown = {
    engagement:      parseFloat(calcEngagementScore(profile.avgLikes, profile.avgReplies, profile.followers).toFixed(1)),
    followerQuality: parseFloat(calcFollowerQualityScore(profile.followers, engagementRate).toFixed(1)),
    growth:          parseFloat(calcGrowthScore(profile.followers, engagementRate).toFixed(1)),
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

  // Growth rate derived from real engagement (not random)
  const growthRate = parseFloat(
    Math.min(25, Math.max(-5, (engagementRate - 2.5) * 4)).toFixed(2)
  );

  return { score, engagementRate, growthRate, breakdown };
}

// ─── Real Twitter data via RapidAPI ──────────────────────────────────────────

class TwitterApiError extends Error {
  constructor(
    public readonly code: "USER_NOT_FOUND" | "RATE_LIMIT" | "API_ERROR" | "NO_KEY",
    message: string
  ) {
    super(message);
    this.name = "TwitterApiError";
  }
}

async function fetchTwitterProfile(username: string): Promise<TwitterProfile> {
  const apiKey = process.env.TWITTER_API_KEY;
  if (!apiKey) throw new TwitterApiError("NO_KEY", "Twitter API key not configured");

  const headers = {
    "X-RapidAPI-Key":  apiKey,
    "X-RapidAPI-Host": RAPIDAPI_HOST,
  };

  // ── User profile ─────────────────────────────────────────────────────────
  const userRes = await fetch(
    `https://${RAPIDAPI_HOST}/screenname.php?screenname=${encodeURIComponent(username)}`,
    { headers, signal: AbortSignal.timeout(API_TIMEOUT_MS) }
  );

  if (userRes.status === 404) throw new TwitterApiError("USER_NOT_FOUND", `@${username} not found on X`);
  if (userRes.status === 429) throw new TwitterApiError("RATE_LIMIT", "X API rate limit reached");
  if (!userRes.ok)            throw new TwitterApiError("API_ERROR", `Twitter API ${userRes.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await userRes.json() as any;
  console.log("API DATA (profile):", JSON.stringify(user).slice(0, 500));

  const followers        = Number(user.followers_count ?? user.follower_count  ?? 0);
  const following        = Number(user.friends_count   ?? user.following_count ?? 0);
  const tweets           = Number(user.statuses_count  ?? user.tweet_count     ?? 0);
  const resolvedUsername = String(user.screen_name ?? user.username ?? username);

  // ── Recent tweets for real engagement ────────────────────────────────────
  let avgLikes = 0, avgReplies = 0, avgRetweets = 0;

  try {
    const tweetsRes = await fetch(
      `https://${RAPIDAPI_HOST}/timeline.php?screenname=${encodeURIComponent(username)}&limit=10`,
      { headers, signal: AbortSignal.timeout(API_TIMEOUT_MS) }
    );

    if (tweetsRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await tweetsRes.json() as any;
      console.log("API DATA (timeline sample):", JSON.stringify(data).slice(0, 300));

      const list: Record<string, number>[] = Array.isArray(data)
        ? data
        : (data.timeline ?? data.results ?? data.data ?? []);

      if (list.length > 0) {
        const avg = (k1: string, k2 = "") =>
          list.reduce((acc: number, t) => acc + (Number(t[k1]) || Number(t[k2]) || 0), 0) / list.length;

        avgLikes    = avg("favorite_count", "likes");
        avgReplies  = avg("reply_count",    "replies");
        avgRetweets = avg("retweet_count",  "retweets");

        console.log(`Engagement from ${list.length} tweets — likes:${avgLikes.toFixed(1)} replies:${avgReplies.toFixed(1)} retweets:${avgRetweets.toFixed(1)}`);
      }
    }
  } catch (e) {
    console.warn("Timeline fetch failed:", e);
  }

  return { username: resolvedUsername, followers, following, tweets, avgLikes, avgReplies, avgRetweets };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  // ── Auth check ────────────────────────────────────────────────────────────
  const userId    = typeof body?.userId    === "string" ? body.userId    : null;
  const userEmail = typeof body?.userEmail === "string" ? body.userEmail : null;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized", message: "Please sign in to analyze accounts." });
    return;
  }

  const rawUsername =
    typeof body?.username === "string" ? body.username.replace(/^@/, "").trim() : "";

  if (!rawUsername) {
    res.status(400).json({ error: "Bad Request", message: "username is required" });
    return;
  }

  // ── Fetch real data — no fallbacks ───────────────────────────────────────
  let profile: TwitterProfile;

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
      if (err.code === "NO_KEY") {
        res.status(503).json({ error: "Service Unavailable", message: "Twitter API not configured." });
        return;
      }
    }
    console.error("fetchTwitterProfile error:", err);
    res.status(500).json({ error: "Unable to fetch real data", message: "Could not retrieve Twitter data. Try again." });
    return;
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  const { score, engagementRate, growthRate, breakdown } = buildScore(profile);

  // ── Persist ───────────────────────────────────────────────────────────────
  try {
    const db = getPool();
    if (db) {
      await ensureTable(db);
      await db.query(
        `INSERT INTO searches
          (username, score, followers, following, tweets,
           engagement_rate, growth_rate, avg_likes, avg_retweets, avg_replies, tier,
           user_id, user_email)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          profile.username, score, profile.followers, profile.following, profile.tweets,
          engagementRate, growthRate,
          parseFloat(profile.avgLikes.toFixed(1)),
          parseFloat(profile.avgRetweets.toFixed(1)),
          parseFloat(profile.avgReplies.toFixed(1)),
          getTier(profile.followers),
          userId, userEmail,
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
    dataSource:     "real",
    breakdown,
  });
}
