import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("Firebase Admin Auth loads in a CommonJS server runtime", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--no-experimental-require-module",
      "-e",
      "require('firebase-admin/auth'); require('jwks-rsa');",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.error?.message || "");
});
