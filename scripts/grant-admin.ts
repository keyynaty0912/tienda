import { auth } from "../src/lib/firebase-admin";
async function main() {
  const [uid, role] = process.argv.slice(2);
  if (
    !uid ||
    !["admin", "catalog", "support", "fulfillment", "customer"].includes(role)
  )
    throw new Error(
      "Uso: npm run admin:grant -- UID admin|catalog|support|fulfillment|customer",
    );
  const user = await auth().getUser(uid);
  if (!user.emailVerified)
    throw new Error("Verifica primero el correo de esta cuenta.");
  await auth().setCustomUserClaims(uid, { ...user.customClaims, role });
  await auth().revokeRefreshTokens(uid);
  console.log(
    `Rol ${role} asignado al UID indicado. Debe iniciar sesión de nuevo.`,
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
