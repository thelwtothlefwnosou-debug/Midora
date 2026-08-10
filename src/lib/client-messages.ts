import type { AbstractIntlMessages } from "next-intl";

/**
 * Namespaces used only via getTranslations on the server (metadata / RSC pages).
 * Omitting them from NextIntlClientProvider cuts HTML payload without changing UI —
 * server components still load the full message catalog.
 */
const SERVER_ONLY_MESSAGE_NAMESPACES = [
  "Faq",
  "Marketing",
  "Help",
  "Meta",
  "Seo",
  "Site",
  "Accessibility",
] as const;

/**
 * Owner/dashboard/admin client namespaces — heavy and unused on public marketing pages.
 * Public routes omit these; dashboard/admin re-provide the fuller `app` bundle.
 */
const OWNER_APP_MESSAGE_NAMESPACES = [
  "Wizard",
  "Owner",
  "Workspace",
  "Aade",
  // AccountNav stays in the public bundle — UserMenu on marketing pages uses it.
  "Dashboard",
  "OwnerNav",
] as const;

export type ClientMessageBundle = "public" | "app";

function omitNamespaces(
  messages: AbstractIntlMessages,
  namespaces: readonly string[]
): AbstractIntlMessages {
  const next: AbstractIntlMessages = { ...messages };
  for (const ns of namespaces) {
    delete next[ns];
  }
  return next;
}

/**
 * Client-safe messages for NextIntlClientProvider (same strings, smaller payload).
 * - `public`: marketing / search / listing pages (no wizard/owner workspace dictionaries)
 * - `app`: everything client components need (still drops server-only namespaces)
 */
export function pickClientMessages(
  messages: AbstractIntlMessages,
  bundle: ClientMessageBundle = "app"
): AbstractIntlMessages {
  const withoutServer = omitNamespaces(messages, SERVER_ONLY_MESSAGE_NAMESPACES);
  if (bundle === "public") {
    return omitNamespaces(withoutServer, OWNER_APP_MESSAGE_NAMESPACES);
  }
  return withoutServer;
}
