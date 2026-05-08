import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

const ALLOWED_KEYS = [
  "BAKONG_ACCOUNT_ID",
  "MERCHANT_NAME",
  "MERCHANT_CITY",
  "ACQUIRING_BANK",
  "BAKONG_TOKEN",
];

async function getAllSettings(userId: string): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.userId, userId));
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (ALLOWED_KEYS.includes(row.key)) {
      result[row.key] = row.value;
    }
  }
  return result;
}

router.get("/settings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthedRequest).userId;
  try {
    const settings = await getAllSettings(userId);
    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "Error fetching settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/settings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthedRequest).userId;
  try {
    const body = req.body as Record<string, string>;

    for (const key of ALLOWED_KEYS) {
      const value = body[key];
      if (value === undefined) continue;

      const trimmed = String(value).trim();
      if (!trimmed) {
        await db
          .delete(settingsTable)
          .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, key)));
      } else {
        await db
          .insert(settingsTable)
          .values({ userId, key, value: trimmed })
          .onConflictDoUpdate({
            target: [settingsTable.userId, settingsTable.key],
            set: { value: trimmed, updatedAt: new Date() },
          });
      }
    }

    const updated = await getAllSettings(userId);
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error saving settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { getAllSettings };
export default router;
