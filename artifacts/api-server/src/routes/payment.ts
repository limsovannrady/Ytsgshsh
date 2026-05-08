import { Router, type IRouter } from "express";
import { db, paymentsTable } from "@workspace/db";
import { GetPaymentHistoryResponse } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

const BAKONG_API = "https://bakong.cambo-kh.com";
const USER_TG_ID = "5002402843";

function getBakongToken(): string {
  const token = process.env["BAKONG_TOKEN"];
  if (!token) throw new Error("BAKONG_TOKEN is not set");
  return token;
}

async function generateQr(
  amount: number,
  currency: string,
  description: string | undefined,
  token: string
): Promise<{ qr: string; md5: string }> {
  const params = new URLSearchParams({
    type: "generate_qr",
    user_tg_id: USER_TG_ID,
    amount: String(amount),
    currency,
  });
  if (description) params.set("description", description);

  const response = await fetch(`${BAKONG_API}/api/payment?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });

  const data = await response.json() as { status?: string; data?: { qr?: string; md5?: string }; message?: string };
  if (data.status !== "success" || !data.data?.qr || !data.data?.md5) {
    throw Object.assign(new Error(data.message ?? "Failed to generate QR"), { bakongData: data });
  }
  return { qr: data.data.qr, md5: data.data.md5 };
}

async function checkMd5(
  md5: string,
  token: string
): Promise<{ paid: boolean; data: unknown }> {
  const params = new URLSearchParams({ type: "check_md5", user_tg_id: USER_TG_ID, md5 });
  const response = await fetch(`${BAKONG_API}/api/payment?${params.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json() as { status?: string; data?: unknown };
  const paid = data.status === "success" && data.data != null;
  return { paid, data: data.data ?? null };
}

// ─── Unified public endpoint: /api/payment?type=...&... ──────────────────────
router.all("/payment", async (req, res): Promise<void> => {
  const type = (req.query["type"] as string | undefined)?.trim();

  if (!type) {
    res.status(400).json({ status: "error", message: "Missing type parameter" });
    return;
  }

  try {
    const token = getBakongToken();

    // ── generate_qr ──────────────────────────────────────────────────────────
    if (type === "generate_qr") {
      const rawAmount = req.query["amount"] ?? req.body?.amount;
      const currency = (req.query["currency"] ?? req.body?.currency ?? "USD") as string;
      const description = (req.query["description"] ?? req.body?.description) as string | undefined;

      const amount = parseFloat(String(rawAmount));
      if (!rawAmount || isNaN(amount) || amount <= 0) {
        res.status(400).json({ status: "error", message: "Invalid amount" });
        return;
      }

      const { qr, md5 } = await generateQr(amount, currency, description, token);

      await db.insert(paymentsTable).values({
        qr, md5,
        amount: String(amount),
        currency,
        description: description ?? null,
        status: "pending",
      }).onConflictDoNothing();

      res.json({ status: "success", data: { qr, md5, amount, currency } });
      return;
    }

    // ── check_md5 ────────────────────────────────────────────────────────────
    if (type === "check_md5") {
      const md5 = (req.query["md5"] ?? req.body?.md5) as string | undefined;
      if (!md5) {
        res.status(400).json({ status: "error", message: "Missing md5 parameter" });
        return;
      }

      const { paid, data } = await checkMd5(md5, token);

      if (paid) {
        await db.update(paymentsTable).set({ status: "paid" }).where(eq(paymentsTable.md5, md5));
      }

      res.json({ status: paid ? "success" : "pending", paid, data, md5 });
      return;
    }

    // ── get_pos ──────────────────────────────────────────────────────────────
    if (type === "get_pos") {
      const params = new URLSearchParams({ type: "get_pos", user_tg_id: USER_TG_ID });
      const response = await fetch(`${BAKONG_API}/api/payment?${params.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json() as { status?: string; data?: unknown };
      res.json(data);
      return;
    }

    // ── history ──────────────────────────────────────────────────────────────
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
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// ─── Internal REST routes (used by the frontend hooks) ───────────────────────
router.post("/payment/generate-qr", async (req, res): Promise<void> => {
  const { amount, currency = "USD", description } = req.body ?? {};
  const num = parseFloat(String(amount));
  if (!amount || isNaN(num) || num <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }
  try {
    const token = getBakongToken();
    const { qr, md5 } = await generateQr(num, currency, description, token);
    await db.insert(paymentsTable).values({
      qr, md5, amount: String(num), currency,
      description: description ?? null, status: "pending",
    }).onConflictDoNothing();
    res.json({ status: "success", qr, md5, amount: num, currency, description: description ?? null, createdAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error generating QR");
    res.status(500).json({ error: (err as Error).message ?? "Internal server error" });
  }
});

router.get("/payment/check/:md5", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.md5) ? req.params.md5[0] : req.params.md5;
  if (!raw) { res.status(400).json({ error: "Missing md5" }); return; }
  try {
    const token = getBakongToken();
    const { paid, data } = await checkMd5(raw, token);
    if (paid) {
      await db.update(paymentsTable).set({ status: "paid" }).where(eq(paymentsTable.md5, raw));
    }
    res.json({ status: paid ? "paid" : "pending", md5: raw, paid, data });
  } catch (err) {
    req.log.error({ err }, "Error checking payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payment/pos", async (req, res): Promise<void> => {
  try {
    const token = getBakongToken();
    const params = new URLSearchParams({ type: "get_pos", user_tg_id: USER_TG_ID });
    const response = await fetch(`${BAKONG_API}/api/payment?${params.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json() as { status?: string; data?: unknown };
    res.json({ status: data.status ?? "success", data: data.data ?? null });
  } catch (err) {
    req.log.error({ err }, "Error fetching POS info");
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
