#!/usr/bin/env node
/**
 * Detect deprecated public/owner UI strings and imports in active source.
 * Exits 1 if hard regressions found in src/ (not docs/tests/archive).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
]);

const SKIP_PATH_PARTS = [
  "/docs/",
  "\\docs\\",
  "/scripts/extracted-from-transcript/",
  "\\scripts\\extracted-from-transcript\\",
];

const HARD_CHECKS = [
  {
    id: "public-similar-listings-heading",
    pattern: /Παρόμοιες αγγελίες/g,
    globs: ["components/listings", "app/listings"],
    message: "Deprecated heading «Παρόμοιες αγγελίες» in public listing UI",
  },
  {
    id: "public-indicative-price-label",
    pattern: /Ενδεικτική τιμή/g,
    globs: ["components/listings", "app/listings"],
    message: "Deprecated public label «Ενδεικτική τιμή»",
  },
  {
    id: "search-card-badges-import",
    pattern: /ListingCardBadges/g,
    files: ["components/listings/SearchListingCard.tsx"],
    message: "Deprecated ListingCardBadges in SearchListingCard",
  },
  {
    id: "extracted-transcript-import",
    pattern: /extracted-from-transcript/g,
    globs: ["app", "components", "lib"],
    message: "Import from extracted transcript snapshot",
  },
];

const SOFT_CHECKS = [
  {
    id: "public-preview-label",
    pattern: /Προεπισκόπηση/g,
    globs: ["components/listings/detail", "app/listings"],
    message: "Legacy «Προεπισκόπηση» in public listing UI (should be «Προβολή»)",
  },
  {
    id: "available-overlay-en",
    pattern: /\bAvailable\b/g,
    globs: ["components/listings", "components/availability"],
    message: "Legacy English availability overlay «Available»",
  },
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (!/\.(tsx?|jsx?|css)$/.test(entry.name)) continue;
    if (SKIP_PATH_PARTS.some((p) => full.includes(p))) continue;
    files.push(full);
  }
  return files;
}

function relFromSrc(file) {
  return path.relative(SRC, file).replace(/\\/g, "/");
}

function matchesGlob(rel, glob) {
  return rel.startsWith(glob.replace(/\\/g, "/"));
}

function runChecks(checks, severity) {
  const files = walk(SRC);
  const findings = [];

  for (const check of checks) {
    const targets = files.filter((file) => {
      const rel = relFromSrc(file);
      if (check.files?.length) {
        return check.files.some((f) => rel === f.replace(/\\/g, "/"));
      }
      if (check.globs?.length) {
        return check.globs.some((g) => matchesGlob(rel, g));
      }
      return true;
    });

    for (const file of targets) {
      const content = fs.readFileSync(file, "utf8");
      if (!check.pattern.test(content)) continue;
      check.pattern.lastIndex = 0;
      findings.push({
        severity,
        id: check.id,
        file: path.relative(ROOT, file).replace(/\\/g, "/"),
        message: check.message,
      });
    }
  }

  return findings;
}

function checkDeprecatedRoutes() {
  const warnings = [];
  const legacyRoutes = [
    { file: "src/app/search/page.tsx", note: "Legacy /search route file" },
    { file: "src/app/dashboard/inquiries/page.tsx", note: "Legacy /dashboard/inquiries (use /dashboard/requests)" },
  ];

  for (const route of legacyRoutes) {
    const full = path.join(ROOT, route.file);
    if (fs.existsSync(full)) {
      warnings.push({ ...route, severity: "warn" });
    }
  }

  return warnings;
}

function main() {
  const hard = runChecks(HARD_CHECKS, "error");
  const soft = runChecks(SOFT_CHECKS, "warn");
  const routeWarnings = checkDeprecatedRoutes();

  console.log("\n== Old UI regression scan ==\n");

  if (hard.length === 0) {
    console.log("Hard regressions: none");
  } else {
    console.log(`Hard regressions: ${hard.length}`);
    for (const f of hard) {
      console.log(`  [FAIL] ${f.file} — ${f.message}`);
    }
  }

  if (soft.length > 0) {
    console.log(`\nSoft warnings: ${soft.length}`);
    for (const f of soft) {
      console.log(`  [WARN] ${f.file} — ${f.message}`);
    }
  }

  if (routeWarnings.length > 0) {
    console.log(`\nLegacy route files: ${routeWarnings.length}`);
    for (const w of routeWarnings) {
      console.log(`  [WARN] ${w.file} — ${w.note}`);
    }
  }

  if (hard.length > 0) {
    console.log("\nqa:doctor — old UI regression FAILED\n");
    process.exit(1);
  }

  console.log("\nqa:doctor — old UI regression OK\n");
}

main();
