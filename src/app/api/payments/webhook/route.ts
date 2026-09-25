import { NextResponse } from "next/server";
import {
  verifyEvent,
  paymentEnvironment,
  wompi,
  transactionSchema,
} from "@/lib/payments";
import { applyPayment } from "@/lib/orders";
import { readJson, failure } from "@/lib/security";
import { AppError } from "@/lib/errors";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const secret = process.env.WOMPI_EVENTS_SECRET;
    if (!secret) throw new AppError(503, "Webhook no configurado.");
    const e = verifyEvent(await readJson(req), secret, paymentEnvironment());
    const signed = transactionSchema.parse(e.data.transaction);
    const authoritative = await wompi.lookup(signed.id);
    if (signed.amount_in_cents !== authoritative.amount_in_cents)
      throw new AppError(409, "Importe inconsistente.");
    await applyPayment(authoritative, Date.now());
    return NextResponse.json({ received: true });
  } catch (e) {
    return failure(e);
  }
}
