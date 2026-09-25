import { NextResponse } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase-admin";
import {
  user,
  checkOrigin,
  readJson,
  failure,
  limitRequest,
} from "@/lib/security";
import { AppError } from "@/lib/errors";
import { publicOrder } from "@/lib/orders";
import type { Order } from "@/lib/schema";
export async function GET() {
  try {
    const u = await user();
    if (!u) throw new AppError(401, "Inicia sesión para consultar tu cuenta.");
    const [orders, profile] = await Promise.all([
      col("orders")
        .where("customerUid", "==", u.uid)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get(),
      col("profiles").doc(u.uid).get(),
    ]);
    return NextResponse.json({
      orders: orders.docs.map((d) => publicOrder(d.data() as Order)),
      addresses: profile.data()?.addresses || [],
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    checkOrigin(req);
    const u = await user();
    if (!u) throw new AppError(401, "Inicia sesión.");
    await limitRequest(req, "profile", 20);
    const data = z
      .object({
        addresses: z
          .array(
            z.object({
              label: z.string().max(60),
              department: z.string().max(80),
              city: z.string().max(80),
              address: z.string().min(5).max(200),
              complement: z.string().max(200),
            }),
          )
          .max(10),
      })
      .parse(await readJson(req));
    await col("profiles")
      .doc(u.uid)
      .set({ ...data, updatedAt: Date.now() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
