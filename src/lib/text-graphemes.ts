/** Count user-perceived characters (Greek combining marks, emoji, etc.). */
export function countGraphemes(value: string): number {
  if (!value) return 0;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let count = 0;
    for (const _ of segmenter.segment(value)) count += 1;
    return count;
  }
  // Code-point fallback (better than UTF-16 .length for surrogate pairs).
  return [...value].length;
}
