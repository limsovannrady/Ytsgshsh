import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentRouter from "./payment";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(paymentRouter);

export default router;
