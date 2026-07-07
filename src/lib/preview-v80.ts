/**
 * Preview polish toward ~80/100 scores.
 * Set NEXT_PUBLIC_PREVIEW_V80=true in .env.local to preview.
 * Remove or set false to restore current production behavior instantly.
 */
export const isPreviewV80 = process.env.NEXT_PUBLIC_PREVIEW_V80 === "true";
