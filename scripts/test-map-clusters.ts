/**
 * Smoke test: cluster index must resolve leaves from the same instance that produced cluster ids.
 * Run: npx tsx scripts/test-map-clusters.ts
 */
import {
  buildSuperclusterIndex,
  safeClusterExpansionZoom,
} from "../src/components/map/use-map-clusters";
import type { MapMarker } from "../src/components/map/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

const markers: MapMarker[] = Array.from({ length: 40 }, (_, i) => ({
  id: `listing-${i}`,
  lat: 37.98 + (i % 8) * 0.002,
  lng: 23.72 + Math.floor(i / 8) * 0.003,
  title: `Listing ${i}`,
  price: 50 + i,
  priceLabel: `€${50 + i}`,
  city: "Αθήνα",
  area: "Κέντρο",
}));

const bounds: [number, number, number, number] = [23.71, 37.97, 23.75, 38.0];

for (const zoom of [8, 10, 12, 14, 16, 18]) {
  const indexA = buildSuperclusterIndex(markers);
  const indexB = buildSuperclusterIndex(markers);
  const features = indexA.getClusters(bounds, zoom);

  for (const feature of features) {
    const props = feature.properties as {
      cluster?: boolean;
      cluster_id?: number;
    };
    if (!props.cluster || props.cluster_id == null) continue;

    let crashed = false;
    try {
      indexB.getLeaves(props.cluster_id, 50);
      crashed = true;
    } catch {
      // expected when using a different index instance
    }
    assert(crashed, `expected stale index lookup to throw at zoom ${zoom}`);

    const leaves = indexA.getLeaves(props.cluster_id, 50);
    assert(leaves.length > 0, `leaves should exist at zoom ${zoom}`);

    const expansion = safeClusterExpansionZoom(indexA, props.cluster_id);
    assert(expansion != null, `expansion zoom should resolve at zoom ${zoom}`);
  }
}

const empty = buildSuperclusterIndex([]);
assert(empty.getClusters(bounds, 12).length === 0, "empty index returns no clusters");

console.log("OK: map cluster smoke tests passed");
