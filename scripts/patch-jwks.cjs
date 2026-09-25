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
if (!source.includes(newFunction) || source.includes(oldImport)) {
  if (!source.includes(oldImport) || !source.includes(oldFunction)) {
    throw new Error("jwks-rsa source changed; review the ESM patch.");
  }
  fs.writeFileSync(
    sourcePath,
    source.replace(oldImport, "").replace(oldFunction, newFunction),
  );
}

const passportPath = path.join(
  path.dirname(packagePath),
  "src",
  "integrations",
  "passport.js",
);
const passport = fs.readFileSync(passportPath, "utf8");
const passportNewline = passport.includes("\r\n") ? "\r\n" : "\n";
const passportOldImport = `const jose = require('jose');${passportNewline}`;
const passportOldFunction = `return function secretProvider(req, rawJwtToken, cb) {${passportNewline}    let decoded;`;
const passportNewFunction = [
  "return async function secretProvider(req, rawJwtToken, cb) {",
  "    let jose;",
  "    try {",
  "      jose = await import('jose');",
  "    } catch (err) {",
  "      return cb(err, null);",
  "    }",
  "    let decoded;",
].join(passportNewline);
if (!passport.includes(passportNewFunction) || passport.includes(passportOldImport)) {
  if (!passport.includes(passportOldImport) || !passport.includes(passportOldFunction)) {
    throw new Error("jwks-rsa Passport source changed; review the ESM patch.");
  }
  fs.writeFileSync(
    passportPath,
    passport
      .replace(passportOldImport, "")
      .replace(passportOldFunction, passportNewFunction),
  );
}
process.stdout.write("jwks-rsa ESM compatibility patch applied\n");
