import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, searchesTable } from "@workspace/db";
import {
  GetSearchByIdParams,
  GetSearchHistoryResponse,
  GetSearchByIdResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/searches", async (req, res): Promise<void> => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  const rows = await db
    .select()
    .from(searchesTable)
    .where(userId ? eq(searchesTable.userId, userId) : undefined)
    .orderBy(desc(searchesTable.searchedAt))
    .limit(20);

  res.json(GetSearchHistoryResponse.parse(rows));
});

router.get("/searches/:id", async (req, res): Promise<void> => {
  const params = GetSearchByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Bad Request", message: params.error.message });
    return;
  }

  const [search] = await db
    .select()
    .from(searchesTable)
    .where(eq(searchesTable.id, params.data.id));

  if (!search) {
    res.status(404).json({ error: "Not Found", message: "Search record not found" });
    return;
  }

  res.json(GetSearchByIdResponse.parse(search));
});

export default router;
