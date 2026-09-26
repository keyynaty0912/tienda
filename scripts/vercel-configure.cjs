// Sends prepared variables via stdin; never puts secrets in arguments or logs.
const fs = require("node:fs");
const { parseEnv } = require("node:util");
const { spawnSync } = require("node:child_process");
const env = parseEnv(fs.readFileSync(".env.vercel", "utf8"));
const project = JSON.parse(fs.readFileSync(".vercel/project.json", "utf8"));
if (
  project.projectName !== "tienda" ||
  env.NEXT_PUBLIC_SITE_URL !== "https://tienda-five-lemon.vercel.app"
) {
  throw new Error(
    "The linked project or site does not match the authorized store.",
  );
}
const keys = [
  "NEXT_PUBLIC_SITE_URL",
  "CATALOG_MODE",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "CHECKOUT_ENABLED",
  "WOMPI_ENV",
  "LIVE_PAYMENTS_APPROVED",
  "ORDER_TOKEN_SECRET",
  "CRON_SECRET",
  "EMAIL_PROVIDER",
];
const sensitive = new Set([
  "FIREBASE_PRIVATE_KEY",
  "ORDER_TOKEN_SECRET",
  "CRON_SECRET",
]);
for (const name of keys) {
  if (!env[name]) throw new Error(`Missing variable: ${name}`);
  const result = spawnSync(
    process.execPath,
    [
      process.argv[2],
      "env",
      "add",
      name,
      "production",
      "--force",
      "--yes",
      "--scope",
      "store-3e3e",
      ...(sensitive.has(name) ? ["--sensitive"] : []),
    ],
    { input: env[name], encoding: "utf8", windowsHide: true },
  );
  if (result.status !== 0)
    throw new Error(`Vercel rejected ${name}; no values logged.`);
  console.log(`Configured ${name}`);
}
