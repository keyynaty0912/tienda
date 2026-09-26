// Read-only diagnostics. Never print credentials, tokens, or API keys.
const fs = require("node:fs");
const { cert } = require("firebase-admin/app");
async function main() {
  const key = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const project = key.project_id;
  const { access_token } = await cert(key).getAccessToken();
  async function get(url) {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    return { ok: r.ok, status: r.status, data: d };
  }
  const base = `https://firebase.googleapis.com/v1beta1/projects/${project}`;
  const [info, apps, databases, auth, buckets, releases] = await Promise.all([
    get(base),
    get(`${base}/webApps`),
    get(`https://firestore.googleapis.com/v1/projects/${project}/databases`),
    get(
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`,
    ),
    get(
      `https://storage.googleapis.com/storage/v1/b?project=${project}&fields=items(name,location),nextPageToken`,
    ),
    get(`https://firebaserules.googleapis.com/v1/projects/${project}/releases`),
  ]);
  const error = (r) => ({
    status: r.status,
    error: r.data.error?.status,
    reason: r.data.error?.details?.[0]?.reason,
  });
  console.log(
    JSON.stringify(
      {
        project,
        info: info.ok
          ? { name: info.data.displayName, state: info.data.state }
          : error(info),
        apps: apps.ok
          ? (apps.data.apps || []).map((a) => ({
              name: a.name,
              displayName: a.displayName,
              appId: a.appId,
            }))
          : error(apps),
        databases: databases.ok
          ? (databases.data.databases || []).map((d) => ({
              name: d.name,
              location: d.locationId,
              type: d.type,
            }))
          : error(databases),
        auth: auth.ok
          ? {
              emailEnabled: auth.data.signIn?.email?.enabled,
              authorizedDomains: auth.data.authorizedDomains,
              mfa: auth.data.mfa,
              subtype: auth.data.subtype,
            }
          : error(auth),
        buckets: buckets.ok ? buckets.data.items || [] : error(buckets),
        rules: releases.ok
          ? (releases.data.releases || []).map((r) => ({
              name: r.name,
              rulesetName: r.rulesetName,
            }))
          : error(releases),
      },
      null,
      2,
    ),
  );
}
main().catch((e) => {
  console.error("Firebase diagnostic failed:", e.code || e.name);
  process.exitCode = 1;
});
