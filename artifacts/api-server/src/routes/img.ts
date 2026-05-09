import { Router, type IRouter } from "express";
import { db, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import QRCodeLib from "qrcode";

const router: IRouter = Router();

router.get("/img/:filename", async (req, res): Promise<void> => {
  const filename = req.params["filename"] ?? "";
  const md5 = filename.replace(/\.png$/i, "");

  if (!md5 || !/^[a-f0-9]{32}$/i.test(md5)) {
    res.status(400).json({ status: "error", message: "Invalid QR code ID" });
    return;
  }

  const [row] = await db
    .select({ qr: paymentsTable.qr })
    .from(paymentsTable)
    .where(eq(paymentsTable.md5, md5))
    .limit(1);

  if (!row) {
    res.status(404).json({ status: "error", message: "QR code not found" });
    return;
  }

  const pngBuffer = await QRCodeLib.toBuffer(row.qr, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `inline; filename="${md5}.png"`);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(pngBuffer);
});

export default router;
