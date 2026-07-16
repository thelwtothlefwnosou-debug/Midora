#!/usr/bin/env node
/**
 * Midora QA doctor — git state, branch, old UI regression.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
    ...opts,
  });
  return result;
}

function section(title) {
  console.log(`\n== ${title} ==\n`);
}

function main() {
  let failed = false;

  section("Git branch");
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch.status === 0) {
    console.log(branch.stdout.trim());
  } else {
    console.log("Could not read branch");
    failed = true;
  }

  section("Latest commit");
  const head = run("git", ["log", "-1", "--oneline"]);
  if (head.status === 0 && head.stdout.trim()) {
    console.log(head.stdout.trim());
  } else {
    console.log(head.stderr?.trim() || "Could not read latest commit");
    failed = true;
  }

  section("Uncommitted changes");
  const status = run("git", ["status", "--short"]);
  if (status.status === 0) {
    const lines = status.stdout.trim().split("\n").filter(Boolean);
    if (lines.length === 0) {
      console.log("(clean working tree)");
    } else {
      console.log(`${lines.length} changed file(s):`);
      for (const line of lines.slice(0, 40)) console.log(`  ${line}`);
      if (lines.length > 40) console.log(`  ... and ${lines.length - 40} more`);
    }
  }

  section("Canonical UI quick check");
  const verify = run("powershell", [
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "scripts/verify-canonical-ui.ps1",
  ]);
  if (verify.status !== 0) {
    failed = true;
  } else {
    console.log(verify.stdout.trim());
  }

  section("Old UI regression");
  const regression = run("node", ["scripts/check-old-ui-regression.mjs"]);
  if (regression.stdout?.trim()) console.log(regression.stdout.trim());
  if (regression.stderr?.trim()) console.error(regression.stderr.trim());
  if (regression.status !== 0) {
    failed = true;
  }

  console.log("");
  if (failed) {
    console.log("qa:doctor — FAILED");
    process.exit(1);
  }
  console.log("qa:doctor — PASS");
}

main();
