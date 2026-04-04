import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const db = getPool();
    if (!db) {
      res.status(200).json([]);
      return;
    }

    const { rows } = await db.query(
      `SELECT
         id, username, score, followers, following, tweets,
         engagement_rate AS "engagementRate",
         growth_rate AS "growthRate",
         avg_likes AS "avgLikes",
         avg_retweets AS "avgRetweets",
         avg_replies AS "avgReplies",
         tier,
         searched_at AS "searchedAt"
       FROM searches
       ORDER BY searched_at DESC
       LIMIT 10`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("DB query error:", err);
    res.status(200).json([]);
  }
}
