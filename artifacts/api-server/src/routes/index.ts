import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import searchesRouter from "./searches";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(searchesRouter);

export default router;
