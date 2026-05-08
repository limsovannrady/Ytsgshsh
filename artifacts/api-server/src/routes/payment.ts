import { Router, type IRouter } from "express";
import { db, paymentsTable } from "@workspace/db";
import {
  GenerateQrBody,
  CheckPaymentParams,
  GetPaymentHistoryResponse,
} from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

const BAKONG_API = "https://bakong.nbc.gov.kh";

function getBakongToken(): string {
  const token = process.env["BAKONG_TOKEN"];
  if (!token) throw new Error("BAKONG_TOKEN is not set");
  return token;
}

router.post("/payment/generate-qr", async (req, res): Promise<void> => {
  const parsed = GenerateQrBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, currency = "USD", description } = parsed.data;

  try {
    const token = getBakongToken();
    const response = await fetch(`${BAKONG_API}/api/payment?type=generate_qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, currency, description }),
    });

    const data = await response.json() as { status?: string; data?: { qr?: string; md5?: string }; message?: string };

    if (!response.ok || data.status !== "success" || !data.data?.qr || !data.data?.md5) {
      req.log.error({ data }, "Bakong API error on generate-qr");
      res.status(500).json({ error: (data as { message?: string }).message ?? "Failed to generate QR" });
      return;
    }

    const { qr, md5 } = data.data;

    await db.insert(paymentsTable).values({
      qr,
      md5,
      amount: String(amount),
      currency,
      description: description ?? null,
      status: "pending",
    }).onConflictDoNothing();

    res.json({
      status: "success",
      qr,
      md5,
      amount,
      currency,
      description: description ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error generating QR");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payment/check/:md5", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.md5) ? req.params.md5[0] : req.params.md5;
  const params = CheckPaymentParams.safeParse({ md5: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { md5 } = params.data;

  try {
    const token = getBakongToken();
    const response = await fetch(`${BAKONG_API}/api/payment?type=check_transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ md5 }),
    });

    const data = await response.json() as { status?: string; data?: unknown };

    const paid = data.status === "success" && data.data != null;

    if (paid) {
      await db
        .update(paymentsTable)
        .set({ status: "paid" })
        .where(eq(paymentsTable.md5, md5));
    }

    res.json({
      status: paid ? "paid" : "pending",
      md5,
      paid,
      data: data.data ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error checking payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payment/pos", async (req, res): Promise<void> => {
  try {
    const token = getBakongToken();
    const response = await fetch(`${BAKONG_API}/api/payment?type=get_pos`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json() as { status?: string; data?: unknown };

    res.json({
      status: data.status ?? "success",
      data: data.data ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching POS info");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payment/history", async (req, res): Promise<void> => {
  try {
    const records = await db
      .select()
      .from(paymentsTable)
      .orderBy(desc(paymentsTable.createdAt))
      .limit(50);

    const result = GetPaymentHistoryResponse.parse(
      records.map((r) => ({
        id: r.id,
        qr: r.qr,
        md5: r.md5,
        amount: Number(r.amount),
        currency: r.currency,
        description: r.description ?? null,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error fetching payment history");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
