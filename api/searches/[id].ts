import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = parseInt(raw ?? "", 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid id" });
    return;
  }

  try {
    const db = getPool();
    if (!db) {
      res.status(404).json({ error: "Not Found", message: "Database not configured" });
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
       WHERE id = $1`,
      [id]
    );

    if (!rows[0]) {
      res.status(404).json({ error: "Not Found", message: `Record ${id} not found` });
      return;
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("DB query error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Query failed" });
  }
}
