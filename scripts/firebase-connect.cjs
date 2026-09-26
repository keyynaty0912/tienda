// Registers the web app and prepares ignored env files. Does not enable billing/payments.
const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { cert } = require("firebase-admin/app");
async function main() {
  if (fs.existsSync(".env.vercel"))
    throw new Error("Prepared env files exist; nothing was changed.");
  const keyPath = path.resolve(process.argv[2]);
  const key = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const project = key.project_id;
  const { access_token } = await cert(key).getAccessToken();
  async function api(url, method = "GET", body) {
    const r = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    const d = await r.json();
    if (!r.ok)
      throw new Error(
        `${method} ${new URL(url).pathname}: ${r.status} ${d.error?.status || ""} ${d.error?.message || ""}`,
      );
    return d;
  }
  const base = `https://firebase.googleapis.com/v1beta1/projects/${project}`;
  const apps = (await api(`${base}/webApps`)).apps || [];
  let app = apps.find(
    (a) => a.displayName?.replaceAll("&amp;", "&") === "Key & Naty Web",
  );
  if (!app) {
    let op = await api(`${base}/webApps`, "POST", {
      displayName: "Key & Naty Web",
    });
    for (let i = 0; !op.done && i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      op = await api(`https://firebase.googleapis.com/v1beta1/${op.name}`);
    }
    if (op.error || !op.response)
      throw new Error(
        `Web app creation pending or failed: ${op.error?.code || "pending"}`,
      );
    app = op.response;
  }
  console.log("Firebase web app:", app.displayName);
  const config = await api(
    `https://firebase.googleapis.com/v1beta1/${app.name}/config`,
  );
  const dbBase = `https://firestore.googleapis.com/v1/projects/${project}/databases`;
  const databases = (await api(dbBase)).databases || [];
  const databaseExists = databases.some((d) => d.name.endsWith("/(default)"));
  console.log(
    databaseExists
      ? "Firestore database exists."
      : "Firestore is missing; owner access is required to create it.",
  );
  const localFile = databaseExists ? ".env.local" : ".env.firebase.pending";
  if (fs.existsSync(localFile) || fs.existsSync(".env.vercel"))
    throw new Error(
      "Prepared env files already exist; they were not overwritten.",
    );
  let env = fs.readFileSync(".env.example", "utf8");
  const values = {
    FIREBASE_PROJECT_ID: project,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: project,
    NEXT_PUBLIC_FIREBASE_API_KEY: config.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.authDomain,
    NEXT_PUBLIC_FIREBASE_APP_ID: config.appId,
    FIREBASE_STORAGE_BUCKET: config.storageBucket || "",
    ORDER_TOKEN_SECRET: randomBytes(32).toString("hex"),
    CRON_SECRET: randomBytes(32).toString("hex"),
  };
  for (const [name, value] of Object.entries(values))
    env = env.replace(new RegExp(`^${name}=.*$`, "m"), `${name}=${value}`);
  const site = new URL(process.argv[3]);
  if (site.protocol !== "https:" || site.pathname !== "/")
    throw new Error("Provide the HTTPS origin of the production store.");
  let deployed = env
    .replace(
      /^NEXT_PUBLIC_SITE_URL=.*$/m,
      `NEXT_PUBLIC_SITE_URL=${site.origin}`,
    )
    .replace(/^CATALOG_MODE=.*$/m, "CATALOG_MODE=production")
    .replace(
      /^FIREBASE_CLIENT_EMAIL=.*$/m,
      `FIREBASE_CLIENT_EMAIL=${key.client_email}`,
    )
    .replace(
      /^FIREBASE_PRIVATE_KEY=.*$/m,
      () => `FIREBASE_PRIVATE_KEY=${JSON.stringify(key.private_key)}`,
    )
    .replace(
      /^ORDER_TOKEN_SECRET=.*$/m,
      `ORDER_TOKEN_SECRET=${randomBytes(32).toString("hex")}`,
    )
    .replace(
      /^CRON_SECRET=.*$/m,
      `CRON_SECRET=${randomBytes(32).toString("hex")}`,
    );
  fs.writeFileSync(".env.vercel", deployed, { flag: "wx", mode: 0o600 });
  env += `\nGOOGLE_APPLICATION_CREDENTIALS=${JSON.stringify(keyPath.replaceAll("\\", "/"))}\n`;
  fs.writeFileSync(localFile, env, { flag: "wx", mode: 0o600 });
  console.log(
    `Prepared ${localFile} and .env.vercel. No secret values printed. Payments remain disabled.`,
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
