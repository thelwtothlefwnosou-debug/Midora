import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { pickClientMessages } from "@/lib/client-messages";

/** Re-provides owner/dashboard client dictionaries under the slim public root layout. */
export async function OwnerIntlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = pickClientMessages(
    (await getMessages()) as AbstractIntlMessages,
    "app"
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
