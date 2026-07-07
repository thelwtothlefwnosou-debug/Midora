import type { ListingWithImages } from "@/lib/types";

export type PriceHistogramBucket = {
  min: number;
  max: number;
  count: number;
};

export function computePriceHistogram(
  listings: ListingWithImages[],
  rentalType: string | undefined,
  bucketCount = 24
): { buckets: PriceHistogramBucket[]; min: number; max: number } {
  const isShort = rentalType === "short_term";
  const prices = listings
    .map((l) => (isShort ? l.price_per_night : l.price_monthly))
    .filter((p): p is number => typeof p === "number" && p > 0);

  if (prices.length === 0) {
    const floor = isShort ? 30 : 400;
    const ceil = isShort ? 250 : 2500;
    return {
      min: floor,
      max: ceil,
      buckets: Array.from({ length: bucketCount }, (_, i) => {
        const step = (ceil - floor) / bucketCount;
        return {
          min: Math.round(floor + step * i),
          max: Math.round(floor + step * (i + 1)),
          count: 0,
        };
      }),
    };
  }

  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  const span = Math.max(max - min, 1);
  const step = span / bucketCount;

  const buckets: PriceHistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    min: Math.round(min + step * i),
    max: Math.round(min + step * (i + 1)),
    count: 0,
  }));

  for (const price of prices) {
    const idx = Math.min(bucketCount - 1, Math.floor((price - min) / step));
    buckets[idx].count++;
  }

  return { buckets, min, max };
}
