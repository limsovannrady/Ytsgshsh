import type { Request, Response, NextFunction } from "express";

export interface AuthedRequest extends Request {
  userId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const userIdHeader = req.headers["x-telegram-user-id"];

  const userId =
    (typeof userIdHeader === "string" && userIdHeader.trim()) ||
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  (req as AuthedRequest).userId = userId;
  next();
}
