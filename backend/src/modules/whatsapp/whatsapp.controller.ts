import { Request, Response } from "express";
import { getWhatsAppStatus } from "./whatsapp.client";

export async function statusController(_req: Request, res: Response) {
  res.json(getWhatsAppStatus());
}
