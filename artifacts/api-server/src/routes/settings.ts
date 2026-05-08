import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const ALLOWED_KEYS = [
  "BAKONG_ACCOUNT_ID",
  "MERCHANT_NAME",
  "MERCHANT_CITY",
  "ACQUIRING_BANK",
  "BAKONG_TOKEN",
];

async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settingsTable);
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (ALLOWED_KEYS.includes(row.key)) {
      result[row.key] = row.value;
    }
  }
  return result;
}

router.get("/settings", async (req, res): Promise<void> => {
  try {
    const settings = await getAllSettings();
    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "Error fetching settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/settings", async (req, res): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;

    for (const key of ALLOWED_KEYS) {
      const value = body[key];
      if (value === undefined) continue;

      const trimmed = String(value).trim();
      if (!trimmed) {
        await db.delete(settingsTable).where(eq(settingsTable.key, key));
      } else {
        await db
          .insert(settingsTable)
          .values({ key, value: trimmed })
          .onConflictDoUpdate({
            target: settingsTable.key,
            set: { value: trimmed, updatedAt: new Date() },
          });
      }
    }

    const updated = await getAllSettings();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error saving settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { getAllSettings };
export default router;
