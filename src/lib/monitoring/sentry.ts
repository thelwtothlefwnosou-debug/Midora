/**
 * Sentry integration-ready helpers — safe no-op without @sentry/nextjs installed.
 *
 * To enable full monitoring:
 * 1. npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
 * 3. Run: npx @sentry/wizard@latest -i nextjs
 */

type SentryContext = {
  userId?: string;
  role?: string;
  pageUrl?: string;
  extra?: Record<string, unknown>;
};

function dsnConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export async function initSentryServer() {
  if (!dsnConfigured()) return;
  if (process.env.NODE_ENV === "development") {
    console.info(
      "[monitoring] Sentry DSN set — run `npm install @sentry/nextjs` and the wizard to enable capture"
    );
  }
}

export async function captureException(error: unknown, context?: SentryContext) {
  if (!dsnConfigured()) return;
  if (process.env.NODE_ENV === "development") {
    console.error("[monitoring]", error, context);
  }
}

export function isSentryEnabled() {
  return dsnConfigured();
}
