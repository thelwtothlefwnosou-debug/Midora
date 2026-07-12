const SLUG_MAX = 60;
const SLUG_MIN = 3;

const GREEK_MAP: Record<string, string> = {
  α: "a",
  β: "v",
  γ: "g",
  δ: "d",
  ε: "e",
  ζ: "z",
  η: "i",
  θ: "th",
  ι: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "x",
  ο: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  ς: "s",
  τ: "t",
  υ: "y",
  φ: "f",
  χ: "ch",
  ψ: "ps",
  ω: "o",
};

function transliterateGreek(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => GREEK_MAP[ch] ?? ch)
    .join("");
}

export function slugifyPublicProfileName(name: string): string {
  const base = transliterateGreek(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX);

  if (base.length >= SLUG_MIN) return base;
  return base.length > 0 ? `${base}-host` : "host";
}

export function normalizePublicProfileSlug(raw: string): string {
  return slugifyPublicProfileName(raw);
}

export function isValidPublicProfileSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function ensureUniquePublicProfileSlug(
  baseSlug: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const normalized = normalizePublicProfileSlug(baseSlug) || "host";
  if (!(await isTaken(normalized))) return normalized;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${normalized}-${i}`.slice(0, SLUG_MAX);
    if (!(await isTaken(candidate))) return candidate;
  }

  return `${normalized}-${Date.now().toString(36).slice(-4)}`.slice(0, SLUG_MAX);
}
