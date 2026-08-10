/**
 * Evidence: public search privacy replaces exact coords server-side.
 * Run: npx tsx scripts/verify-public-search-coords.ts
 */
import {
  applyPublicSearchLocationPrivacy,
  approximateListingMapCenter,
  resolvePublicSearchMapCenter,
} from "../src/lib/listing-map";

const exactLat = 37.9838096;
const exactLng = 23.7275388;

const unconfirmed = {
  id: "privacy-evidence-unconfirmed",
  latitude: exactLat,
  longitude: exactLng,
  location_confirmed_by_owner: false,
  address: "Secret Street 12",
  address_street: "Secret Street",
  address_number: "12",
  address_floor: "3",
  address_unit: "A",
  formatted_address: "Secret Street 12, Athens",
  provider_place_id: "place-xyz",
  private_street: "Secret Street",
  private_street_number: "12",
  private_postal_code: "10557",
  floor: 3,
};

const confirmed = {
  id: "privacy-evidence-confirmed",
  latitude: exactLat,
  longitude: exactLng,
  location_confirmed_by_owner: true,
  address_street: "Public Ave",
  address_number: "1",
  floor: 2,
};

const expectedApprox = approximateListingMapCenter(
  unconfirmed.id,
  exactLat,
  exactLng
);

const publicUnconfirmed = applyPublicSearchLocationPrivacy(unconfirmed);
const publicConfirmed = applyPublicSearchLocationPrivacy(confirmed);

const checks: { name: string; ok: boolean; detail: string }[] = [];

checks.push({
  name: "unconfirmed lat differs from exact",
  ok: publicUnconfirmed.latitude !== exactLat,
  detail: `got ${publicUnconfirmed.latitude}, exact was ${exactLat}`,
});
checks.push({
  name: "unconfirmed lng differs from exact",
  ok: publicUnconfirmed.longitude !== exactLng,
  detail: `got ${publicUnconfirmed.longitude}, exact was ${exactLng}`,
});
checks.push({
  name: "unconfirmed matches deterministic approximate center",
  ok:
    publicUnconfirmed.latitude === expectedApprox.lat &&
    publicUnconfirmed.longitude === expectedApprox.lng,
  detail: JSON.stringify({
    public: {
      lat: publicUnconfirmed.latitude,
      lng: publicUnconfirmed.longitude,
    },
    expectedApprox,
  }),
});
checks.push({
  name: "confirmed keeps exact coords",
  ok:
    publicConfirmed.latitude === exactLat &&
    publicConfirmed.longitude === exactLng,
  detail: JSON.stringify({
    lat: publicConfirmed.latitude,
    lng: publicConfirmed.longitude,
  }),
});
checks.push({
  name: "private address fields redacted",
  ok:
    publicUnconfirmed.address === null &&
    publicUnconfirmed.address_street === null &&
    publicUnconfirmed.address_number === null &&
    publicUnconfirmed.address_floor === null &&
    publicUnconfirmed.address_unit === null &&
    publicUnconfirmed.formatted_address === null &&
    publicUnconfirmed.private_street === null &&
    publicUnconfirmed.floor === null &&
    publicUnconfirmed.public_map_coordinates === true,
  detail: "redaction flags",
});
checks.push({
  name: "resolvePublicSearchMapCenter unconfirmed != exact",
  ok: (() => {
    const c = resolvePublicSearchMapCenter(unconfirmed);
    return Boolean(c && (c.lat !== exactLat || c.lng !== exactLng));
  })(),
  detail: JSON.stringify(resolvePublicSearchMapCenter(unconfirmed)),
});

const failed = checks.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      examples: {
        unconfirmedPublicPayload: {
          id: publicUnconfirmed.id,
          latitude: publicUnconfirmed.latitude,
          longitude: publicUnconfirmed.longitude,
          location_confirmed_by_owner:
            publicUnconfirmed.location_confirmed_by_owner,
          public_map_coordinates: publicUnconfirmed.public_map_coordinates,
          address_street: publicUnconfirmed.address_street,
          floor: publicUnconfirmed.floor,
          exact_not_present:
            publicUnconfirmed.latitude !== exactLat &&
            publicUnconfirmed.longitude !== exactLng,
        },
        confirmedPublicPayload: {
          id: publicConfirmed.id,
          latitude: publicConfirmed.latitude,
          longitude: publicConfirmed.longitude,
          location_confirmed_by_owner:
            publicConfirmed.location_confirmed_by_owner,
          public_map_coordinates: publicConfirmed.public_map_coordinates,
          address_street: publicConfirmed.address_street,
        },
      },
      checks,
      pass: failed.length === 0,
    },
    null,
    2
  )
);

if (failed.length > 0) process.exit(1);
