import { Router, type IRouter } from "express";
import { db, paymentsTable, settingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import QRCodeLib from "qrcode";
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const Jimp = require("jimp") as any;

const router: IRouter = Router();

router.get("/img/:filename", async (req, res): Promise<void> => {
  const filename = req.params["filename"] ?? "";
  const md5 = filename.replace(/\.png$/i, "");

  if (!md5 || !/^[a-f0-9]{32}$/i.test(md5)) {
    res.status(400).json({ status: "error", message: "Invalid QR code ID" });
    return;
  }

  const [row] = await db
    .select({ qr: paymentsTable.qr, userId: paymentsTable.userId })
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

  // Try to load logo from user settings
  let logoData: string | null = null;
  if (row.userId) {
    const [setting] = await db
      .select({ value: settingsTable.value })
      .from(settingsTable)
      .where(
        and(
          eq(settingsTable.userId, row.userId),
          eq(settingsTable.key, "LOGO_DATA")
        )
      )
      .limit(1);
    logoData = setting?.value ?? null;

    // Also check global settings (userId = "global" or no userId filter)
    if (!logoData) {
      const globalRows = await db
        .select({ value: settingsTable.value })
        .from(settingsTable)
        .where(eq(settingsTable.key, "LOGO_DATA"))
        .limit(1);
      logoData = globalRows[0]?.value ?? null;
    }
  } else {
    const globalRows = await db
      .select({ value: settingsTable.value })
      .from(settingsTable)
      .where(eq(settingsTable.key, "LOGO_DATA"))
      .limit(1);
    logoData = globalRows[0]?.value ?? null;
  }

  let finalBuffer = pngBuffer;

  if (logoData) {
    try {
      // Extract base64 data from data URL
      const base64Match = logoData.match(/^data:[^;]+;base64,(.+)$/);
      const base64Data = base64Match ? base64Match[1] : logoData;
      const logoBuffer = Buffer.from(base64Data, "base64");

      const qrImage = await Jimp.read(pngBuffer);
      const logoImage = await Jimp.read(logoBuffer);

      const qrSize = qrImage.bitmap.width;
      const logoSize = Math.round(qrSize * 0.22); // logo ~22% of QR size

      logoImage.resize(logoSize, logoSize);

      // Add white circle background behind logo
      const bgSize = logoSize + 8;
      const bg = new Jimp(bgSize, bgSize, 0xffffffff);

      const bgX = Math.round((qrSize - bgSize) / 2);
      const bgY = Math.round((qrSize - bgSize) / 2);
      const logoX = Math.round((qrSize - logoSize) / 2);
      const logoY = Math.round((qrSize - logoSize) / 2);

      qrImage.composite(bg, bgX, bgY);
      qrImage.composite(logoImage, logoX, logoY);

      finalBuffer = await qrImage.getBufferAsync(Jimp.MIME_PNG);
    } catch (err) {
      req.log.warn({ err }, "Failed to composite logo onto QR, serving plain QR");
    }
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `inline; filename="${md5}.png"`);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(finalBuffer);
});

export default router;
