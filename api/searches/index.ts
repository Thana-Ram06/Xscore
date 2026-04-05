import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = getPool();
    if (!db) {
      res.status(200).json([]);
      return;
    }

    const userId = typeof req.query.userId === "string" ? req.query.userId : null;

    let queryText: string;
    let queryParams: string[];

    if (userId) {
      queryText = `
        SELECT
          id, username, score, followers, following, tweets,
          engagement_rate AS "engagementRate",
          growth_rate AS "growthRate",
          avg_likes AS "avgLikes",
          avg_retweets AS "avgRetweets",
          avg_replies AS "avgReplies",
          tier,
          searched_at AS "searchedAt",
          user_id AS "userId",
          user_email AS "userEmail"
        FROM searches
        WHERE user_id = $1
        ORDER BY searched_at DESC
        LIMIT 50
      `;
      queryParams = [userId];
    } else {
      queryText = `
        SELECT
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
        LIMIT 10
      `;
      queryParams = [];
    }

    const { rows } = await db.query(queryText, queryParams);
    res.status(200).json(rows);
  } catch (err) {
    console.error("DB query error:", err);
    res.status(200).json([]);
  }
}
