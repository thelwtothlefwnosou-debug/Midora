import { getTranslations } from "next-intl/server";

export async function PreviewSkipLink() {
  const t = await getTranslations("Accessibility");
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      {t("skipToContent")}
    </a>
  );
}
