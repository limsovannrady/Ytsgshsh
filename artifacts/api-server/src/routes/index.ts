import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentRouter from "./payment";
import settingsRouter from "./settings";
import imgRouter from "./img";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(imgRouter);
router.use(paymentRouter);

export default router;
