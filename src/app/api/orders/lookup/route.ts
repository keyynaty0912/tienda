import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { authorizedOrder, publicOrder, applyPayment } from "@/lib/orders";
import {
  checkOrigin,
  readJson,
  failure,
  limitRequest,
  user,
} from "@/lib/security";
import { idSchema } from "@/lib/schema";
import { wompi } from "@/lib/payments";
import { AppError } from "@/lib/errors";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await limitRequest(req, "order-lookup", 20);
    const input = z
      .object({
        id: idSchema,
        token: z.string().max(100).optional(),
        transactionId: z.string().max(150).optional(),
      })
      .parse(await readJson(req));
    const guest = (await cookies()).get("kn_guest")?.value,
      u = await user();
    let order = await authorizedOrder(
      input.id,
      guest,
      u?.uid || null,
      input.token,
    );
    if (input.transactionId) {
      const transaction = await wompi.lookup(input.transactionId);
      if (transaction.reference !== order.reference)
        throw new AppError(409, "El pago no corresponde a este pedido.");
      await applyPayment(transaction);
      order = await authorizedOrder(
        input.id,
        guest,
        u?.uid || null,
        input.token,
      );
    }
    return NextResponse.json(publicOrder(order));
  } catch (e) {
    return failure(e);
  }
}
