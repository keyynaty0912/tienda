// jwks-rsa 4.1.0 loads jose 6 (ESM) with require(), which fails in
// CommonJS serverless runtimes. Remove this patch when upstream fixes it.
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const adminRequire = createRequire(require.resolve("firebase-admin/app"));
const packagePath = adminRequire.resolve("jwks-rsa/package.json");
const packageInfo = JSON.parse(fs.readFileSync(packagePath, "utf8"));
if (packageInfo.version !== "4.1.0") {
  throw new Error(
    `Review the jwks-rsa ESM patch for version ${packageInfo.version} before installing.`,
  );
}

const sourcePath = path.join(path.dirname(packagePath), "src", "utils.js");
const source = fs.readFileSync(sourcePath, "utf8");
const newline = source.includes("\r\n") ? "\r\n" : "\n";
const oldImport = `const jose = require('jose');${newline}`;
const oldFunction = `async function retrieveSigningKeys(jwks) {${newline}  const results = [];`;
const newFunction =
  `async function retrieveSigningKeys(jwks) {${newline}  const jose = await import('jose');${newline}  const results = [];`;
if (source.includes(newFunction) && !source.includes(oldImport)) {
  process.stdout.write("jwks-rsa ESM patch already applied\n");
} else {
  if (!source.includes(oldImport) || !source.includes(oldFunction)) {
    throw new Error("jwks-rsa source changed; review the ESM patch.");
  }
  fs.writeFileSync(
    sourcePath,
    source.replace(oldImport, "").replace(oldFunction, newFunction),
  );
  process.stdout.write("Patched jwks-rsa to import jose asynchronously\n");
}
