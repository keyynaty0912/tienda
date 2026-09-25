import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { idSchema } from "@/lib/schema";
import { authorizedOrder } from "@/lib/orders";
import { col } from "@/lib/firebase-admin";
import {
  checkOrigin,
  readJson,
  failure,
  user,
  limitRequest,
} from "@/lib/security";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await limitRequest(req, "support", 10);
    const b = z
      .object({
        orderId: idSchema,
        token: z.string().max(100).optional(),
        type: z.enum([
          "cambio",
          "garantia",
          "retracto",
          "reversion",
          "devolucion",
          "privacidad",
          "ayuda",
        ]),
        reason: z.string().trim().min(10).max(2000),
      })
      .parse(await readJson(req));
    const u = await user();
    await authorizedOrder(
      b.orderId,
      (await cookies()).get("kn_guest")?.value,
      u?.uid || null,
      b.token,
    );
    const ref = col("support").doc();
    await ref.create({
      id: ref.id,
      orderId: b.orderId,
      type: b.type,
      reason: b.reason,
      status: "open",
      response: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
