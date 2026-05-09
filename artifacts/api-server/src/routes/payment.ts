import { Router, type IRouter } from "express";
import { db, paymentsTable, settingsTable } from "@workspace/db";
import { GetPaymentHistoryResponse } from "@workspace/api-zod";
import { desc, eq, and } from "drizzle-orm";
import { createRequire } from "module";
import { getAllSettings } from "./settings.js";
import { requireAuth, type AuthedRequest } from "../middlewares/auth.js";

const require = createRequire(import.meta.url);
const { BakongKHQR, IndividualInfo, khqrData } = require("bakong-khqr");

const router: IRouter = Router();

async function getGlobalSettings(): Promise<Record<string, string>> {
  const KEYS = ["BAKONG_ACCOUNT_ID", "MERCHANT_NAME", "MERCHANT_CITY", "ACQUIRING_BANK", "BAKONG_TOKEN"];
  const rows = await db.select().from(settingsTable);
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (KEYS.includes(row.key) && !result[row.key]) {
      result[row.key] = row.value;
    }
  }
  return result;
}

async function getMerchantConfig(userId: string) {
  const settings = await getAllSettings(userId);

  const globalSettings = await getGlobalSettings();

  const accountId = settings["BAKONG_ACCOUNT_ID"] || globalSettings["BAKONG_ACCOUNT_ID"] || process.env["BAKONG_ACCOUNT_ID"];
  const merchantName = settings["MERCHANT_NAME"] || globalSettings["MERCHANT_NAME"] || process.env["MERCHANT_NAME"];
  const merchantCity = settings["MERCHANT_CITY"] || globalSettings["MERCHANT_CITY"] || process.env["MERCHANT_CITY"] || "Phnom Penh";
  const acquiringBank = settings["ACQUIRING_BANK"] || globalSettings["ACQUIRING_BANK"] || process.env["ACQUIRING_BANK"] || "";

  if (!accountId) throw new Error("BAKONG_ACCOUNT_ID មិនទាន់កំណត់ទេ — សូមកំណត់ក្នុង ការកំណត់");
  if (!merchantName) throw new Error("MERCHANT_NAME មិនទាន់កំណត់ទេ — សូមកំណត់ក្នុង ការកំណត់");

  return { accountId, merchantName, merchantCity, acquiringBank };
}

async function generateQr(
  userId: string,
  amount: number,
  currency: string,
  description?: string
): Promise<{ qr: string; md5: string }> {
  const { accountId, merchantName, merchantCity, acquiringBank } = await getMerchantConfig(userId);

  const currencyCode = currency.toUpperCase() === "KHR"
    ? khqrData.currency.khr
    : khqrData.currency.usd;

  const expiry = Date.now() + 15 * 60 * 1000;

  const optional: Record<string, unknown> = {
    currency: currencyCode,
    amount,
    expirationTimestamp: String(expiry),
  };
  if (acquiringBank) optional.acquiringBank = acquiringBank;
  if (description) optional.purposeOfTransaction = description.slice(0, 25);

  const info = new IndividualInfo(accountId, merchantName, merchantCity, optional);

  const bakong = new BakongKHQR();
  const result = bakong.generateIndividual(info);

  if (result.status?.code !== 0 || !result.data?.qr) {
    throw new Error(result.status?.message ?? "Failed to generate KHQR");
  }

  return { qr: result.data.qr, md5: result.data.md5 };
}

async function checkPaymentStatus(
  userId: string,
  md5: string
): Promise<{ paid: boolean; data: unknown }> {
  const settings = await getAllSettings(userId);
  const bakongToken = settings["BAKONG_TOKEN"] || process.env["BAKONG_TOKEN"];

  if (bakongToken) {
    try {
      const response = await fetch(
        `https://api.bakongrelay.com/v1/check_transaction_by_md5`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bakongToken}`,
          },
          body: JSON.stringify({ md5 }),
        }
      );
      const data = await response.json() as { responseCode?: number; data?: unknown };
      const paid = data.responseCode === 0 && data.data != null;
      return { paid, data: data.data ?? null };
    } catch {
      // fall through to DB check
    }
  }

  const [row] = await db
    .select({ status: paymentsTable.status })
    .from(paymentsTable)
    .where(eq(paymentsTable.md5, md5))
    .limit(1);

  return { paid: row?.status === "paid", data: null };
}

// ─── Unified public endpoint: /api/payment?type=... ──────────────────────────
router.all("/payment", async (req, res): Promise<void> => {
  const tgIdFromQuery = (req.query["user_tg_id"] as string | undefined)?.trim();
  const type = (req.query["type"] as string | undefined)?.trim();

  // ── Browser redirect: show PayPage instead of JSON ──────────────────────────
  const acceptsHtml = (req.headers["accept"] ?? "").includes("text/html");
  const isBrowserRequest = acceptsHtml && !req.headers["x-requested-with"];
  if (isBrowserRequest && type === "generate_qr" && tgIdFromQuery) {
    const fwd = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "";
    const proto = req.headers["x-forwarded-proto"] ?? "https";
    const origin = fwd ? `${proto}://${fwd}` : `http://localhost:${process.env["PORT"] ?? 8080}`;
    const params = new URLSearchParams();
    params.set("user_tg_id", tgIdFromQuery);
    if (req.query["amount"]) params.set("amount", String(req.query["amount"]));
    if (req.query["currency"]) params.set("currency", String(req.query["currency"]));
    if (req.query["description"]) params.set("description", String(req.query["description"]));
    res.redirect(302, `${origin}/?${params.toString()}`);
    return;
  }

  let userId: string;
  if (tgIdFromQuery) {
    userId = `tg_${tgIdFromQuery}`;
  } else {
    const authHeader = req.headers["authorization"];
    const userIdHeader = req.headers["x-telegram-user-id"];
    const resolved =
      (typeof userIdHeader === "string" && userIdHeader.trim()) ||
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null);
    if (!resolved) {
      res.status(401).json({ status: "error", message: "Missing user_tg_id or auth header" });
      return;
    }
    userId = resolved;
  }

  if (!type) {
    res.status(400).json({ status: "error", message: "Missing type parameter" });
    return;
  }

  try {
    if (type === "generate_qr") {
      const rawAmount = req.query["amount"] ?? req.body?.amount;
      const currency = (req.query["currency"] ?? req.body?.currency ?? "USD") as string;
      const description = (req.query["description"] ?? req.body?.description) as string | undefined;

      const amount = parseFloat(String(rawAmount));
      if (!rawAmount || isNaN(amount) || amount <= 0) {
        res.status(400).json({ status: "error", message: "Invalid amount" });
        return;
      }

      const { qr, md5 } = await generateQr(userId, amount, currency, description);

      await db.insert(paymentsTable).values({
        userId, qr, md5,
        amount: String(amount),
        currency,
        description: description ?? null,
        status: "pending",
      }).onConflictDoNothing();

      res.json({ status: "success", data: { qr, md5, amount, currency } });
      return;
    }

    if (type === "check_md5") {
      const md5 = (req.query["md5"] ?? req.body?.md5) as string | undefined;
      if (!md5) {
        res.status(400).json({ status: "error", message: "Missing md5 parameter" });
        return;
      }

      const { paid, data } = await checkPaymentStatus(userId, md5);

      if (paid) {
        await db.update(paymentsTable).set({ status: "paid" }).where(eq(paymentsTable.md5, md5));
      }

      res.json({ status: paid ? "success" : "pending", paid, data, md5 });
      return;
    }

    if (type === "history") {
      const records = await db
        .select().from(paymentsTable)
        .orderBy(desc(paymentsTable.createdAt)).limit(50);

      const result = GetPaymentHistoryResponse.parse(
        records.map((r) => ({
          id: r.id, qr: r.qr, md5: r.md5,
          amount: Number(r.amount), currency: r.currency,
          description: r.description ?? null,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))
      );
      res.json({ status: "success", data: result });
      return;
    }

    res.status(400).json({ status: "error", message: "Invalid type parameter" });
  } catch (err) {
    req.log.error({ err }, "Payment route error");
    res.status(500).json({ status: "error", message: (err as Error).message ?? "Internal server error" });
  }
});

// ─── REST routes ─────────────────────────────────────────────────────────────
router.post("/payment/generate-qr", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthedRequest).userId;
  const { amount, currency = "USD", description } = req.body ?? {};
  const num = parseFloat(String(amount));
  if (!amount || isNaN(num) || num <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }
  try {
    const { qr, md5 } = await generateQr(userId, num, currency, description);
    await db.insert(paymentsTable).values({
      userId, qr, md5, amount: String(num), currency,
      description: description ?? null, status: "pending",
    }).onConflictDoNothing();
    res.json({ status: "success", qr, md5, amount: num, currency, description: description ?? null, createdAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error generating QR");
    res.status(500).json({ error: (err as Error).message ?? "Internal server error" });
  }
});

router.get("/payment/check/:md5", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthedRequest).userId;
  const raw = Array.isArray(req.params.md5) ? req.params.md5[0] : req.params.md5;
  if (!raw) { res.status(400).json({ error: "Missing md5" }); return; }
  try {
    const { paid, data } = await checkPaymentStatus(userId, raw);
    if (paid) {
      await db.update(paymentsTable).set({ status: "paid" }).where(eq(paymentsTable.md5, raw));
    }
    res.json({ status: paid ? "paid" : "pending", md5: raw, paid, data });
  } catch (err) {
    req.log.error({ err }, "Error checking payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payment/history", async (req, res): Promise<void> => {
  try {
    const records = await db.select().from(paymentsTable)
      .orderBy(desc(paymentsTable.createdAt)).limit(50);
    const result = GetPaymentHistoryResponse.parse(
      records.map((r) => ({
        id: r.id, qr: r.qr, md5: r.md5,
        amount: Number(r.amount), currency: r.currency,
        description: r.description ?? null,
        status: r.status, createdAt: r.createdAt.toISOString(),
      }))
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error fetching payment history");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
