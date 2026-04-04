import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";

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

function getTier(followers: number): string {
  if (followers < 1_000) return "Nano";
  if (followers < 10_000) return "Micro";
  if (followers < 100_000) return "Mid";
  if (followers < 1_000_000) return "Macro";
  return "Mega";
}

function generateMockData(username: string) {
  const seed = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = (min: number, max: number) => {
    const x = Math.sin(seed + min + max) * 10000;
    return min + ((x - Math.floor(x)) * (max - min));
  };

  const followers = Math.floor(rand(500, 2_000_000));
  const following = Math.floor(rand(100, Math.min(followers * 0.8, 50_000)));
  const tweets = Math.floor(rand(50, 50_000));
  const avgLikes = rand(2, Math.min(followers * 0.05, 50_000));
  const avgRetweets = avgLikes * rand(0.1, 0.3);
  const avgReplies = avgLikes * rand(0.05, 0.15);
  const engagementRate = parseFloat(
    (((avgLikes + avgRetweets + avgReplies) / followers) * 100).toFixed(2)
  );
  const growthRate = parseFloat(rand(-5, 25).toFixed(2));
  const score = parseFloat(
    Math.min(1000, (followers * engagementRate) / 100).toFixed(1)
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
  };
}

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

  const data = generateMockData(rawUsername);

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

  res.status(200).json(data);
}
