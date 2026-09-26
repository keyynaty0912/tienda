// Real Firestore connectivity/concurrency check, isolated from orders and inventory.
const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { randomUUID } = require("node:crypto");
const assert = require("node:assert/strict");
async function main() {
  const project = process.env.FIREBASE_PROJECT_ID;
  if (!project) throw new Error("FIREBASE_PROJECT_ID is required");
  const app = initializeApp({
    projectId: project,
    credential: process.env.FIREBASE_PRIVATE_KEY
      ? cert({
          projectId: project,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        })
      : applicationDefault(),
  });
  const db = getFirestore(app);
  const products = await db.collection("demo_products").get();
  console.log(`Firestore read OK: ${products.size} demonstration products`);
  const ref = db.collection("demo_connection_checks").doc(randomUUID());
  await ref.create({ available: 1 });
  try {
    const reserve = () =>
      db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (snapshot.get("available") !== 1) return false;
        tx.update(ref, { available: 0 });
        return true;
      });
    const results = await Promise.all([reserve(), reserve()]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await ref.get()).get("available"), 0);
    console.log("Concurrent transactions OK: only one reservation accepted");
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/demo_products/vestido-alma`,
    );
    assert.equal(response.status, 403);
    console.log("Firestore rules OK: unauthenticated direct access denied");
  } finally {
    await ref.delete();
    await db.terminate();
  }
}
main().catch((e) => {
  console.error("Firebase verification failed:", e.code || e.message);
  process.exitCode = 1;
});
