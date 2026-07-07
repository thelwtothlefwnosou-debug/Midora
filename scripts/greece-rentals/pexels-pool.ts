/**
 * Πραγματικές φωτογραφίες εσωτερικού/ακινήτου από Pexels (δωρεάν άδεια χρήσης).
 * Κάθε ID είναι διαφορετική φωτογραφία — όχι τα ίδια 30 Unsplash σε ρόταση.
 */
const PEXELS_APARTMENT_IDS = [
  1457842, 1571460, 1643383, 1668869, 1866149, 1867773, 1876020, 1918291, 206172, 208736,
  259588, 259962, 271816, 276724, 280222, 281611, 281679, 36366, 374870, 439391, 534151,
  582451, 584399, 667838, 677526, 701877, 706143, 74910, 813692, 87223, 903171, 942825,
  988305, 1080721, 1080696, 1105766, 1119922, 1184592, 1188315, 1215386, 1249664, 1251262,
  1285172, 1329711, 1336177, 1350789, 1365425, 1370704, 1384842, 1396122, 1428348, 1432302,
  1444294, 1444708, 1454806, 1484156, 1486596, 1493808, 1502672, 1571453, 1580600, 1589591,
  160379, 1631338, 1648768, 1669799, 1702957, 1728297, 1743227, 1743229, 1759823, 1766725,
  1795507, 1801224, 1813472, 1835927, 1851164, 1867747, 189456, 1916526, 1922018, 1931204,
  1974596, 1981921, 2062431, 2089698, 2102587, 2102656, 2121121, 213162, 2132227, 2145123,
  2169671, 2179214, 2183952, 2205369, 2227833, 2251247, 2273875, 2295744, 2319792, 2321933,
  2343468, 2373712, 2383607, 2383853, 2404026, 2410763, 2430587, 2440471, 245208, 2455398,
  2462010, 2467557, 250192, 2507016, 2526100, 2526875, 2529148, 2531120, 2562658, 2563733,
  2581922, 259580, 2614438, 2623481, 2624055, 2631743, 2631746, 2631747, 2635038, 264507,
  2656666, 266414, 2672351, 2672786, 2685922, 2691419, 269181, 2697049, 2716242, 271743,
  2724748, 2724749, 2733918, 2736376, 2736469, 275959, 276583, 277667, 277904, 280659,
  281662, 2836917, 2838914, 2844472, 285047, 2853589, 2867235, 2881373, 2883049, 2888924,
  2891355, 2905954, 2915951, 2927527, 293304, 2933045, 2947137, 2956463, 296162, 2973952,
  298095, 2988860, 2993481, 2993603, 3002670, 301395, 3016430, 3029064, 303836, 304012,
  3054691, 3061171, 3067931, 3071105, 3089398, 3097112, 3104560, 312418, 313691, 314106,
  315938, 316376, 317183, 3227774, 323772, 323780, 326566, 3288101, 3296754, 3310472,
  333012, 3338498, 3345940, 3357022, 3361947, 3373732, 3385041, 3394650, 3401413, 3413512,
  3421525, 3439305, 3443589, 3459712, 3468900, 3474064, 3484437, 3497490, 3503770, 3512650,
];

export function pexelsUrl(photoId: number, width = 1280): string {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

export async function buildPhotoPool(count: number): Promise<string[]> {
  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (apiKey) {
    const fromApi = await fetchPexelsApiPool(apiKey, count);
    if (fromApi.length >= count) return fromApi.slice(0, count);
  }

  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = PEXELS_APARTMENT_IDS[i % PEXELS_APARTMENT_IDS.length];
    const width = 1100 + (i % 5) * 40;
    urls.push(pexelsUrl(id, width));
  }
  return urls;
}

export function photosForListing(pool: string[], listingIndex: number, perListing: number): string[] {
  const out: string[] = [];
  for (let j = 0; j < perListing; j++) {
    const idx = (listingIndex * perListing + j) % pool.length;
    out.push(pool[idx]);
  }
  return [...new Set(out)];
}

async function fetchPexelsApiPool(apiKey: string, minCount: number): Promise<string[]> {
  const queries = [
    "apartment interior",
    "modern living room",
    "bedroom apartment",
    "kitchen modern home",
    "bathroom apartment",
    "house interior greece",
  ];
  const urls = new Set<string>();

  for (const query of queries) {
    for (let page = 1; page <= 4 && urls.size < minCount; page++) {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=80&page=${page}`,
        { headers: { Authorization: apiKey } }
      );
      if (!res.ok) break;
      const data = (await res.json()) as {
        photos?: { src?: { large2x?: string; large?: string } }[];
      };
      for (const p of data.photos ?? []) {
        const url = p.src?.large2x || p.src?.large;
        if (url) urls.add(url);
      }
      await sleep(400);
    }
  }
  return [...urls];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
