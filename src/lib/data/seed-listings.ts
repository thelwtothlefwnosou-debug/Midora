import type { ListingWithImages, ListingImage, ListingFilters } from "@/lib/types";
import {
  applyListingFilters,
  sortListings,
} from "@/lib/listing-filters";

/** Unsplash property photo pool — varied interiors & exteriors */
const PHOTOS = [
  "photo-1502672260266-1c1ef2d93688",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1613490493576-7fde63acd811",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1493809842364-78817add7ffb",
  "photo-1600596542815-ffad4c1539a9",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1600566753086-9143d071cb5c",
  "photo-1600585154340-be6161a56a0c",
  "photo-1600210492486-716fe82227fd",
  "photo-1586023492125-27b2c045efd7",
  "photo-1571059048253-8942b5c33461",
  "photo-1564013799919-ab600027ffc6",
  "photo-1512917774080-9991f1c4c750",
  "photo-1605276374109-8e413d1a8a7f",
  "photo-1615874959473-8f6085e8e726",
  "photo-1501183639438-63cb3756ed55",
  "photo-1570129477492-45c003edd2be",
  "photo-1600047509807-ba8f99d2a7a0",
  "photo-1616598222612-ef8299077817",
  "photo-1600585154526-990dced4db0d",
  "photo-1560185007-5f0ed841d1d6",
  "photo-1598928506311-d326778b3f7e",
  "photo-1600607687644-a7abf7101567",
  "photo-1631889993959-f3e7434d576f",
  "photo-1600047509358-677dc007b086",
  "photo-1600585152915-d208bec867a1",
  "photo-1600607687920-4e2a09cf159d",
  "photo-1484154218962-a197022b5858",
  "photo-1600573472592-401b489b3cdc",
];

function img(id: string, w = 900) {
  return `https://images.unsplash.com/${id}?w=${w}&q=80`;
}

function makeImages(listingId: string, count: number, offset: number): ListingImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${listingId}-img-${i}`,
    listing_id: listingId,
    url: img(PHOTOS[(offset + i) % PHOTOS.length]),
    sort_order: i,
    media_type: "image" as const,
    duration_seconds: null,
  }));
}

type SeedRaw = {
  id: string;
  title: string;
  description: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  price: number;
  bedrooms: number;
  sqm: number;
  furnished: boolean;
  utilitiesIncluded: boolean;
  hasParking?: boolean;
  petsAllowed?: boolean;
  maxGuests?: number;
  cleaningIncluded?: boolean;
  minMonths: number;
  propertyType: string;
  hostName: string;
  hostPhone: string;
  photoCount: number;
  photoOffset: number;
  tag?: string;
};

const HOSTS = [
  { name: "Γιώργος Παπαδόπουλος", phone: "+30 697 384 2156" },
  { name: "Μαρία Νικολάου", phone: "+30 694 521 7893" },
  { name: "Νίκος Αντωνίου", phone: "+30 693 847 1205" },
  { name: "Ελένη Δημητρίου", phone: "+30 698 234 5671" },
  { name: "Κώστας Γεωργίου", phone: "+30 697 912 4830" },
  { name: "Σοφία Παπαδοπούλου", phone: "+30 694 678 9012" },
  { name: "Δημήτρης Ιωάννου", phone: "+30 693 156 7842" },
  { name: "Αννα Μιχαηλίδου", phone: "+30 697 445 3218" },
  { name: "Παύλος Κωνσταντίνου", phone: "+30 698 789 0456" },
  { name: "Χριστίνα Βασιλείου", phone: "+30 694 312 6789" },
  { name: "Αλέξανδρος Στεφάνου", phone: "+30 697 567 8901" },
  { name: "Ιωάννα Φωτιάδου", phone: "+30 693 890 1234" },
  { name: "Μιχάλης Οικονόμου", phone: "+30 698 123 4567" },
  { name: "Κατερίνα Αλεξίου", phone: "+30 694 456 7890" },
  { name: "Θανάσης Πέτρου", phone: "+30 697 234 5678" },
];

function h(i: number) {
  const host = HOSTS[i % HOSTS.length];
  return { hostName: host.name, hostPhone: host.phone };
}

const RAW: SeedRaw[] = [
  // ═══ ΑΘΗΝΑ (12) ═══
  { id: "seed-001", title: "Loft με θέα στην Ακρόπολη", description: "Ανακαινισμένο loft 5ου ορόφου με ανελκυστήρα. Πλήρως επιπλωμένο, smart TV, κλιματισμός, πλυντήριο. 5 λεπτά από σταθμό Συγγρού-Fix. Ιδανικό για expats & remote workers.", city: "Αθήνα", area: "Κουκάκι", lat: 37.9668, lng: 23.7281, price: 850, bedrooms: 2, sqm: 72, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(0), photoCount: 12, photoOffset: 0, tag: "Premium" },
  { id: "seed-002", title: "Penthouse με βεράντα & θέα θάλασσα", description: "Εξοχικό penthouse στη Γλυφάδα με 80τ.μ. βεράντα. 3 υ/δ, 2 μπάνια, parking, αποθήκη. Θέα στο Αιγαίο. Κοντά σε μαρίνα & εστιατόρια.", city: "Αθήνα", area: "Γλυφάδα", lat: 37.8625, lng: 23.7547, price: 1450, bedrooms: 3, sqm: 95, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(1), photoCount: 15, photoOffset: 3, tag: "Luxury" },
  { id: "seed-003", title: "Μοντέρνο διαμέρισμα Κολωνάκι", description: "Design διαμέρισμα 3ου ορόφου, ανακαινισμένο 2024. Designer επίπλωση, Nespresso, high-speed WiFi 500Mbps. Κοντά σε Βουλή & Σύνταγμα.", city: "Αθήνα", area: "Κολωνάκι", lat: 37.9778, lng: 23.7418, price: 1100, bedrooms: 1, sqm: 58, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(2), photoCount: 10, photoOffset: 5 },
  { id: "seed-004", title: "Διαμέρισμα 2 υ/δ Εξάρχεια", description: "Ζεστό διαμέρισμα σε ήσυχη οδό, πλήρως επιπλωμένο. Κοντά σε μετρό Βικτώρια & πεζόδρομο. Ιδανικό για φοιτητές μεταπτυχιακούς.", city: "Αθήνα", area: "Εξάρχεια", lat: 37.9882, lng: 23.7340, price: 650, bedrooms: 2, sqm: 65, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(3), photoCount: 8, photoOffset: 7 },
  { id: "seed-005", title: "Ρετιρέ με θέα Λυκαβηττό", description: "Φωτεινό ρετιρέ στο Παγκράτι με πανοραμική θέα. 2 υ/δ, αυλή 40τ.μ., BBQ. Ήσυχη γειτονιά, 10 λεπτά περπάτημα από Καλλιμάρμορο.", city: "Αθήνα", area: "Παγκράτι", lat: 37.9681, lng: 23.7432, price: 780, bedrooms: 2, sqm: 78, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(4), photoCount: 11, photoOffset: 9 },
  { id: "seed-006", title: "Βίλα με κήπο Κηφισιά", description: "Ανεξάρτητη βίλα 180τ.μ. με κήπο 300τ.μ. 4 υ/δ, τζάκι, garage 2 αυτοκινήτων. Premium επιπλωμένη. Κοντά σε σχολεία & εμπορικό κέντρο.", city: "Αθήνα", area: "Κηφισιά", lat: 38.0742, lng: 23.8103, price: 2200, bedrooms: 4, sqm: 180, furnished: true, utilitiesIncluded: true, minMonths: 3, propertyType: "house", ...h(5), photoCount: 18, photoOffset: 11, tag: "Luxury" },
  { id: "seed-007", title: "Studio κοντά στο ΕΚΠΑ", description: "Compact studio 35τ.μ. πλήρως εξοπλισμένο. 3 λεπτά από Πανεπιστήμιο, 5 από μετρό Πανεπιστήμιο. Internet included.", city: "Αθήνα", area: "Ζωγράφου", lat: 37.9755, lng: 23.7698, price: 480, bedrooms: 1, sqm: 35, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "studio", ...h(6), photoCount: 7, photoOffset: 13 },
  { id: "seed-008", title: "Διαμέρισμα 3 υ/δ Χαλάνδρι", description: "Οικογενειακό διαμέρισμα 120τ.μ. 3 υ/δ, 2 μπάνια, μπαλκόνια. Κοντά σε metro & εμπορικό. Parking included.", city: "Αθήνα", area: "Χαλάνδρι", lat: 38.0214, lng: 23.7989, price: 950, bedrooms: 3, sqm: 120, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(7), photoCount: 10, photoOffset: 15 },
  { id: "seed-009", title: "Loft Ψυρρή — nightlife district", description: "Industrial loft 90τ.μ. με ψηλά ταβάνια. Open plan, fully equipped kitchen. Heart of Athens nightlife, walking distance to Monastiraki.", city: "Αθήνα", area: "Ψυρρή", lat: 37.9785, lng: 23.7267, price: 720, bedrooms: 1, sqm: 90, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(8), photoCount: 9, photoOffset: 17 },
  { id: "seed-010", title: "Διαμέρισμα Μαρούσι — OAKA", description: "Μοντέρνο 2 υ/δ κοντά σε metro & εμπορικό The Mall. Ιδανικό για εργαζόμενους στη βόρεια προάστια.", city: "Αθήνα", area: "Μαρούσι", lat: 38.0500, lng: 23.8067, price: 680, bedrooms: 2, sqm: 70, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(9), photoCount: 8, photoOffset: 19 },
  { id: "seed-011", title: "Sea view apartment Βούλα", description: "Διαμέρισμα 1ης γραμμής με θέα θάλασσα. 2 υ/δ, βεράντα 25τ.μ. Premium location, 5 min walk to beach.", city: "Αθήνα", area: "Βούλα", lat: 37.8422, lng: 23.7756, price: 1200, bedrooms: 2, sqm: 82, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(10), photoCount: 14, photoOffset: 21, tag: "Premium" },
  { id: "seed-012", title: "Αμίπλωτο 2 υ/δ Νέα Σμύρνη", description: "Φωτεινό αμίπλωτο διαμέρισμα, νέα οικοδομή. 2 υ/δ, 1 μπάνιο, μπαλκόνι. Κοντά σε τραμ & super market.", city: "Αθήνα", area: "Νέα Σμύρνη", lat: 37.9450, lng: 23.7144, price: 520, bedrooms: 2, sqm: 68, furnished: false, utilitiesIncluded: false, minMonths: 3, propertyType: "apartment", ...h(11), photoCount: 6, photoOffset: 23 },

  // ═══ ΘΕΣΣΑΛΟΝΙΚΗ (6) ═══
  { id: "seed-013", title: "Loft Λαδάδικα — city center", description: "Stylish loft στο ιστορικό κέντρο. Exposed brick, fully furnished. Walking distance to waterfront & bars.", city: "Θεσσαλονίκη", area: "Λαδάδικα", lat: 40.6333, lng: 22.9417, price: 620, bedrooms: 1, sqm: 55, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(0), photoCount: 10, photoOffset: 2, tag: "Νέο" },
  { id: "seed-014", title: "Διαμέρισμα 3 υ/δ Καλαμαριά", description: "Spacious apartment near beach. 3 bedrooms, 2 bathrooms, parking. 10 min to airport.", city: "Θεσσαλονίκη", area: "Καλαμαριά", lat: 40.5825, lng: 22.9500, price: 750, bedrooms: 3, sqm: 95, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(1), photoCount: 11, photoOffset: 4 },
  { id: "seed-015", title: "Studio πάνω από Λευκό Πύργο", description: "Compact studio with White Tower view. Perfect for solo travelers & students at AUTH.", city: "Θεσσαλονίκη", area: "Κέντρο", lat: 40.6264, lng: 22.9485, price: 450, bedrooms: 1, sqm: 32, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "studio", ...h(2), photoCount: 7, photoOffset: 6 },
  { id: "seed-016", title: "Ρετιρέ Θεσσαλονίκη — Νέα Παραλία", description: "Top floor apartment with sea view. 2 υ/δ, renovated 2023. All utilities included.", city: "Θεσσαλονίκη", area: "Νέα Παραλία", lat: 40.6142, lng: 22.9534, price: 680, bedrooms: 2, sqm: 75, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(3), photoCount: 9, photoOffset: 8 },
  { id: "seed-017", title: "Διαμέρισμα Τούμπα — στάδιο", description: "2 υ/δ κοντά σε ΠΑΕΚ & πανεπιστήμιο. Fully furnished, quiet building.", city: "Θεσσαλονίκη", area: "Τούμπα", lat: 40.6147, lng: 22.9703, price: 520, bedrooms: 2, sqm: 62, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(4), photoCount: 8, photoOffset: 10 },
  { id: "seed-018", title: "Penthouse Πυλαία — panoramic view", description: "Luxury penthouse overlooking Thermaic Gulf. 3 υ/δ, jacuzzi, smart home.", city: "Θεσσαλονίκη", area: "Πυλαία", lat: 40.5992, lng: 23.0125, price: 980, bedrooms: 3, sqm: 110, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(5), photoCount: 13, photoOffset: 12, tag: "Premium" },

  // ═══ ΠΑΤΡΑ, ΗΡΑΚΛΕΙΟ, ΛΑΡΙΣΑ, ΒΟΛΟΣ (9) ═══
  { id: "seed-019", title: "Πεντάρι κοντά στο πανεπιστήμιο", description: "2 υ/δ στην Άνω Πόλη, πλήρως επιπλωμένο. 5 λεπτά από Πανεπιστήμιο Πατρών.", city: "Πάτρα", area: "Άνω Πόλη", lat: 38.2465, lng: 21.7346, price: 550, bedrooms: 2, sqm: 68, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(6), photoCount: 8, photoOffset: 14 },
  { id: "seed-020", title: "Διαμέρισμα κέντρο Πάτρας", description: "Modern 1 υ/δ near port. Ideal for ferry connections to Italy & Ionian islands.", city: "Πάτρα", area: "Κέντρο", lat: 38.2466, lng: 21.7345, price: 480, bedrooms: 1, sqm: 48, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(7), photoCount: 7, photoOffset: 16 },
  { id: "seed-021", title: "Loft Ρίο — γέφυρα", description: "Loft με θέα γέφυρα Ρίου. 2 υ/δ, parking. 15 min from city center.", city: "Πάτρα", area: "Ρίο", lat: 38.2967, lng: 21.7853, price: 580, bedrooms: 2, sqm: 72, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(8), photoCount: 9, photoOffset: 18 },
  { id: "seed-022", title: "Διαμέρισμα κοντά σε Knossos", description: "2 υ/δ στο Ηράκλειο, κλιματισμός, WiFi. 10 min drive to Knossos palace.", city: "Ηράκλειο", area: "Κέντρο", lat: 35.3387, lng: 25.1442, price: 620, bedrooms: 2, sqm: 70, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(9), photoCount: 10, photoOffset: 20 },
  { id: "seed-023", title: "Villa με πισίνα Ηράκλειο", description: "Private villa 150τ.μ. with pool & garden. 3 υ/δ, BBQ, sea view.", city: "Ηράκλειο", area: "Αμμουδάρα", lat: 35.3512, lng: 25.0789, price: 1100, bedrooms: 3, sqm: 150, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "villa", ...h(10), photoCount: 16, photoOffset: 22, tag: "Luxury" },
  { id: "seed-024", title: "Studio Λάρισα κέντρο", description: "Fully furnished studio near train station. Perfect for business travelers.", city: "Λάρισα", area: "Κέντρο", lat: 39.6390, lng: 22.4191, price: 420, bedrooms: 1, sqm: 38, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "studio", ...h(11), photoCount: 6, photoOffset: 24 },
  { id: "seed-025", title: "Διαμέρισμα 2 υ/δ Λάρισα", description: "Spacious apartment in quiet neighborhood. Near hospitals & university.", city: "Λάρισα", area: "Φιλοθέη", lat: 39.6312, lng: 22.4089, price: 480, bedrooms: 2, sqm: 65, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(0), photoCount: 8, photoOffset: 1 },
  { id: "seed-026", title: "Διαμέρισμα Βόλος — λιμάνι", description: "Sea view apartment 2 min from port. Ferry to Sporades. Fully equipped.", city: "Βόλος", area: "Κέντρο", lat: 39.3619, lng: 22.9425, price: 520, bedrooms: 2, sqm: 68, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(1), photoCount: 9, photoOffset: 3 },
  { id: "seed-027", title: "Studio Πήλιο — θέα", description: "Cozy studio with Pelion mountain view. 15 min from Volos center.", city: "Βόλος", area: "Πορταριά", lat: 39.3823, lng: 23.0012, price: 450, bedrooms: 1, sqm: 40, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "studio", ...h(2), photoCount: 7, photoOffset: 5 },

  // ═══ ΣΑΝΤΟΡΙΝΗ (5) ═══
  { id: "seed-028", title: "Cave house Oia — caldera view", description: "Traditional cave house carved into cliff. Private terrace, sunset views. The ultimate Santorini experience.", city: "Σαντορίνη", area: "Οία", lat: 36.4618, lng: 25.3753, price: 1800, bedrooms: 2, sqm: 65, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "house", ...h(3), photoCount: 20, photoOffset: 7, tag: "Premium" },
  { id: "seed-029", title: "Villa με infinity pool Φηρά", description: "Luxury villa with infinity pool overlooking caldera. 3 υ/δ, daily cleaning available.", city: "Σαντορίνη", area: "Φηρά", lat: 36.4166, lng: 25.4314, price: 2200, bedrooms: 3, sqm: 120, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "villa", ...h(4), photoCount: 22, photoOffset: 9, tag: "Luxury" },
  { id: "seed-030", title: "Apartment Imerovigli — quiet", description: "Peaceful apartment away from crowds. Caldera view, 2 υ/δ, fully equipped kitchen.", city: "Σαντορίνη", area: "Ημεροβίγλι", lat: 36.4342, lng: 25.4212, price: 1400, bedrooms: 2, sqm: 70, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(5), photoCount: 14, photoOffset: 11 },
  { id: "seed-031", title: "Studio Kamari — beach", description: "Beachfront studio 50m from black sand beach. Perfect for long stays off-season.", city: "Σαντορίνη", area: "Καμάρι", lat: 36.3808, lng: 25.4812, price: 750, bedrooms: 1, sqm: 42, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "studio", ...h(6), photoCount: 10, photoOffset: 13 },
  { id: "seed-032", title: "Traditional house Pyrgos", description: "Renovated traditional house in medieval village. Authentic Santorini living.", city: "Σαντορίνη", area: "Πύργος", lat: 36.3833, lng: 25.4500, price: 950, bedrooms: 2, sqm: 80, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "house", ...h(7), photoCount: 12, photoOffset: 15 },

  // ═══ ΜΥΚΟΝΟΣ (4) ═══
  { id: "seed-033", title: "Cycladic villa Mykonos Town", description: "White-washed villa 5 min walk from Little Venice. 3 υ/δ, private pool, sea view.", city: "Μύκονος", area: "Χώρα", lat: 37.4467, lng: 25.3289, price: 2500, bedrooms: 3, sqm: 130, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "villa", ...h(8), photoCount: 20, photoOffset: 17, tag: "Luxury" },
  { id: "seed-034", title: "Apartment Ornos — family beach", description: "Family-friendly apartment 200m from Ornos beach. 2 υ/δ, tavernas nearby.", city: "Μύκονος", area: "Ορνός", lat: 37.4234, lng: 25.3267, price: 1200, bedrooms: 2, sqm: 75, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(9), photoCount: 13, photoOffset: 19 },
  { id: "seed-035", title: "Studio Paradise Beach", description: "Budget-friendly studio near Paradise & Super Paradise beaches. Pool access.", city: "Μύκονος", area: "Πλατύς Γιαλός", lat: 37.4100, lng: 25.3500, price: 850, bedrooms: 1, sqm: 38, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "studio", ...h(10), photoCount: 9, photoOffset: 21 },
  { id: "seed-036", title: "Villa Ano Mera — authentic", description: "Traditional Mykonian villa in village center. Quiet, authentic island life. 2 υ/δ.", city: "Μύκονος", area: "Άνω Μερά", lat: 37.4500, lng: 25.3833, price: 1100, bedrooms: 2, sqm: 90, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "house", ...h(11), photoCount: 11, photoOffset: 23 },

  // ═══ ΚΡΗΤΗ — Χανιά & Ρέθυμνο (4) ═══
  { id: "seed-037", title: "Βίλα με κήπο & πισίνα Χανιά", description: "Stunning villa in Akrotiri peninsula. Pool, olive grove, 10 min from Chania old town.", city: "Χανιά", area: "Ακρωτήρι", lat: 35.5123, lng: 24.0892, price: 1200, bedrooms: 3, sqm: 110, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "villa", ...h(0), photoCount: 16, photoOffset: 0, tag: "Featured" },
  { id: "seed-038", title: "Old town apartment Χανιά", description: "Renovated apartment in Venetian old town. Harbor view, 2 υ/δ, character building.", city: "Χανιά", area: "Παλιά Πόλη", lat: 35.5175, lng: 24.0154, price: 850, bedrooms: 2, sqm: 68, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(1), photoCount: 12, photoOffset: 2 },
  { id: "seed-039", title: "Beach house Platanias", description: "Beachfront house steps from sand. 3 υ/δ, large terrace, BBQ.", city: "Χανιά", area: "Πλατανιάς", lat: 35.5200, lng: 23.9100, price: 950, bedrooms: 3, sqm: 95, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "house", ...h(2), photoCount: 14, photoOffset: 4 },
  { id: "seed-040", title: "Venetian house Ρέθυμνο", description: "Historic house in old town. 2 υ/δ, courtyard, walking distance to Fortezza.", city: "Ρέθυμνο", area: "Παλιά Πόλη", lat: 35.3689, lng: 24.4733, price: 720, bedrooms: 2, sqm: 75, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "house", ...h(3), photoCount: 11, photoOffset: 6 },

  // ═══ ΡΟΔΟΣ, ΚΕΡΚΥΡΑ, ΠΑΡΟΣ, ΝΑΞΟΣ (10) ═══
  { id: "seed-041", title: "Studio δίπλα στη θάλασσα Ρόδος", description: "Beachfront studio in Ixia. Wind surfing spot, fully equipped.", city: "Ρόδος", area: "Ιξιά", lat: 36.4100, lng: 28.2100, price: 480, bedrooms: 1, sqm: 38, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "studio", ...h(4), photoCount: 8, photoOffset: 8 },
  { id: "seed-042", title: "Villa Lindos — acropolis view", description: "Traditional villa overlooking Lindos acropolis. 3 υ/δ, pool, 5 min to village.", city: "Ρόδος", area: "Λίνδος", lat: 36.0917, lng: 28.0883, price: 1100, bedrooms: 3, sqm: 100, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "villa", ...h(5), photoCount: 15, photoOffset: 10, tag: "Premium" },
  { id: "seed-043", title: "Old town Rhodes apartment", description: "Medieval city apartment inside walls. Unique character, 2 υ/δ.", city: "Ρόδος", area: "Μεσαιωνική Πόλη", lat: 36.4444, lng: 28.2278, price: 650, bedrooms: 2, sqm: 60, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(6), photoCount: 10, photoOffset: 12 },
  { id: "seed-044", title: "Corfu old town — UNESCO", description: "Apartment in UNESCO old town. 2 υ/δ, balcony, walking distance to Liston.", city: "Κέρκυρα", area: "Παλιά Πόλη", lat: 39.6243, lng: 19.9217, price: 680, bedrooms: 2, sqm: 65, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(7), photoCount: 11, photoOffset: 14 },
  { id: "seed-045", title: "Villa Paleokastritsa — cliffs", description: "Cliffside villa with Ionian sea views. 3 υ/δ, private access to beach.", city: "Κέρκυρα", area: "Παλαιοκαστρίτσα", lat: 39.6789, lng: 19.7012, price: 950, bedrooms: 3, sqm: 105, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "villa", ...h(8), photoCount: 14, photoOffset: 16 },
  { id: "seed-046", title: "Beach house Glyfada Corfu", description: "Popular beach area. 2 υ/δ, 100m from sand, restaurants nearby.", city: "Κέρκυρα", area: "Γλυφάδα", lat: 39.5833, lng: 19.8500, price: 720, bedrooms: 2, sqm: 72, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "house", ...h(9), photoCount: 10, photoOffset: 18 },
  { id: "seed-047", title: "Naoussa Paros — harbor", description: "Charming house in picturesque fishing village. 2 υ/δ, Cycladic style.", city: "Πάρος", area: "Νάουσα", lat: 37.1234, lng: 25.2345, price: 850, bedrooms: 2, sqm: 70, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "house", ...h(10), photoCount: 12, photoOffset: 20 },
  { id: "seed-048", title: "Parikia Paros — port town", description: "Apartment near port & Parikia beach. Easy ferry connections.", city: "Πάρος", area: "Παροικιά", lat: 37.0853, lng: 25.1489, price: 620, bedrooms: 1, sqm: 48, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(11), photoCount: 8, photoOffset: 22 },
  { id: "seed-049", title: "Villa Naxos — Agios Prokopios", description: "Near best beach of Naxos. 3 υ/δ, garden, 500m from turquoise water.", city: "Νάξος", area: "Άγιος Πρόκοπος", lat: 37.0833, lng: 25.3500, price: 780, bedrooms: 3, sqm: 90, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "villa", ...h(0), photoCount: 13, photoOffset: 24 },
  { id: "seed-050", title: "Chora Naxos — castle", description: "Apartment below Venetian castle. Authentic island living, 2 υ/δ.", city: "Νάξος", area: "Χώρα", lat: 37.1056, lng: 25.3764, price: 580, bedrooms: 2, sqm: 62, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(1), photoCount: 9, photoOffset: 1 },

  // ═══ ΖΑΚΥΝΘΟΣ, ΚΩΣ, ΣΚΙΑΘΟΣ, ΚΕΦΑΛΟΝΙΑ (8) ═══
  { id: "seed-051", title: "Navagio view villa Ζάκυνθος", description: "Villa with Shipwreck Beach views. 3 υ/δ, pool, 4x4 recommended.", city: "Ζάκυνθος", area: "Αναφωνήτρια", lat: 37.9100, lng: 20.6200, price: 900, bedrooms: 3, sqm: 95, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "villa", ...h(2), photoCount: 14, photoOffset: 3 },
  { id: "seed-052", title: "Laganas beach apartment", description: "Near turtle beach. 2 υ/δ, fully furnished, seasonal long stays welcome.", city: "Ζάκυνθος", area: "Λαγανάς", lat: 37.7167, lng: 20.8667, price: 550, bedrooms: 2, sqm: 58, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(3), photoCount: 8, photoOffset: 5 },
  { id: "seed-053", title: "Kos Town — Asclepeion area", description: "Modern apartment near ancient sites. 2 υ/δ, bike friendly island.", city: "Κως", area: "Κέντρο", lat: 36.8933, lng: 27.2889, price: 580, bedrooms: 2, sqm: 65, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(4), photoCount: 9, photoOffset: 7 },
  { id: "seed-054", title: "Kardamena beach house Kos", description: "Beach resort area. 2 υ/δ, 150m from sand, popular with expats.", city: "Κως", area: "Καρδάμαινα", lat: 36.7833, lng: 27.1833, price: 620, bedrooms: 2, sqm: 70, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "house", ...h(5), photoCount: 10, photoOffset: 9 },
  { id: "seed-055", title: "Skiathos Town — port", description: "Apartment 5 min from port & beaches. Mamma Mia island vibes.", city: "Σκιάθος", area: "Χώρα", lat: 39.1625, lng: 23.4908, price: 720, bedrooms: 2, sqm: 68, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(6), photoCount: 11, photoOffset: 11 },
  { id: "seed-056", title: "Koukounaries beach Skiathos", description: "Near famous pine forest beach. 2 υ/δ, nature & sea.", city: "Σκιάθος", area: "Κουκουναριές", lat: 39.1167, lng: 23.4000, price: 680, bedrooms: 2, sqm: 62, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(7), photoCount: 10, photoOffset: 13 },
  { id: "seed-057", title: "Assos village Kefalonia", description: "Picturesque village house. 2 υ/δ, bay views, peaceful long stay.", city: "Κεφαλονιά", area: "Άσσος", lat: 38.1833, lng: 20.4167, price: 750, bedrooms: 2, sqm: 75, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "house", ...h(8), photoCount: 12, photoOffset: 15 },
  { id: "seed-058", title: "Argostoli Kefalonia — capital", description: "City apartment near waterfront. 2 υ/δ, turtle spotting at harbour.", city: "Κεφαλονιά", area: "Αργοστόλι", lat: 38.1753, lng: 20.4894, price: 580, bedrooms: 2, sqm: 60, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(9), photoCount: 8, photoOffset: 17 },

  // ═══ ΜΙΚΡΟΤΕΡΕΣ ΠΟΛΕΙΣ (7) ═══
  { id: "seed-059", title: "Ναύπλιο — παλιά πόλη", description: "Neoclassical apartment in first capital of Greece. 2 υ/δ, Bourtzi view.", city: "Ναύπλιο", area: "Παλιά Πόλη", lat: 37.5673, lng: 22.8013, price: 620, bedrooms: 2, sqm: 68, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(10), photoCount: 10, photoOffset: 19 },
  { id: "seed-060", title: "Καλαμάτα — παραλία", description: "Beach apartment in Messinia. 2 υ/δ, 200m from sand, olive groves nearby.", city: "Καλαμάτα", area: "Κέντρο", lat: 37.0389, lng: 22.1142, price: 520, bedrooms: 2, sqm: 65, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "apartment", ...h(11), photoCount: 8, photoOffset: 21 },
  { id: "seed-061", title: "Καβάλα — λιμάνι", description: "Port city apartment. Ferry to Thassos. 2 υ/δ, sea view.", city: "Καβάλα", area: "Κέντρο", lat: 40.9393, lng: 24.4069, price: 480, bedrooms: 2, sqm: 62, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(0), photoCount: 7, photoOffset: 23 },
  { id: "seed-062", title: "Ιωάννina — λίμνη", description: "Lake view apartment. 2 υ/δ, castle & island nearby.", city: "Ιωάννινα", area: "Κέντρο", lat: 39.6650, lng: 20.8537, price: 450, bedrooms: 2, sqm: 58, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(1), photoCount: 8, photoOffset: 0 },
  { id: "seed-063", title: "Χίος — Καστρόπολις", description: "Medieval mastic village house. Unique architecture, 2 υ/δ.", city: "Χίος", area: "Μεστά", lat: 38.2500, lng: 26.0167, price: 520, bedrooms: 2, sqm: 70, furnished: true, utilitiesIncluded: false, minMonths: 1, propertyType: "house", ...h(2), photoCount: 9, photoOffset: 2 },
  { id: "seed-064", title: "Λευκάδα — Πόρτο Κατσίκι", description: "Near famous beach. 2 υ/δ, Ionian island living.", city: "Λευκάδα", area: "Βασιλική", lat: 38.7833, lng: 20.5833, price: 580, bedrooms: 2, sqm: 65, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(3), photoCount: 10, photoOffset: 4 },
  { id: "seed-065", title: "Καστοριά — λίμνη", description: "Lakefront apartment. 2 υ/δ, fur trade history town.", city: "Καστοριά", area: "Κέντρο", lat: 40.5217, lng: 21.2633, price: 420, bedrooms: 2, sqm: 55, furnished: true, utilitiesIncluded: true, minMonths: 1, propertyType: "apartment", ...h(4), photoCount: 7, photoOffset: 6 },
];

function seedAvailability(index: number): {
  available_from: string;
  available_until: string | null;
} {
  const from = new Date();
  from.setDate(from.getDate() + (index % 45));
  const until = new Date(from);
  until.setMonth(until.getMonth() + 8 + (index % 5));
  return {
    available_from: from.toISOString().slice(0, 10),
    available_until: index % 7 === 0 ? null : until.toISOString().slice(0, 10),
  };
}

function toListing(raw: SeedRaw, index: number): ListingWithImages {
  const now = new Date().toISOString();
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 3);

  return {
    id: raw.id,
    user_id: "seed-host",
    title: raw.title,
    description: raw.description,
    city: raw.city,
    area: raw.area,
    address: null,
    latitude: raw.lat,
    longitude: raw.lng,
    price_monthly: raw.price,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bedrooms <= 1 ? 1 : raw.bedrooms >= 3 ? 2 : 1,
    sqm: raw.sqm,
    floor: null,
    total_floors: null,
    year_built: null,
    year_renovated: null,
    furnished: raw.furnished,
    has_balcony: false,
    has_elevator: false,
    heating_type: null,
    energy_class: null,
    utilities_included: raw.utilitiesIncluded,
    has_parking: raw.hasParking ?? false,
    pets_allowed: raw.petsAllowed ?? false,
    max_guests: raw.maxGuests ?? null,
    cleaning_included: raw.cleaningIncluded ?? false,
    min_months: raw.minMonths,
    ...seedAvailability(index),
    property_type: raw.propertyType,
    status: "approved",
    expires_at: expires.toISOString(),
    created_at: now,
    updated_at: now,
    listing_images: makeImages(raw.id, raw.photoCount, raw.photoOffset),
    profiles: {
      full_name: raw.hostName,
      phone: raw.hostPhone,
    },
  };
}

export const SEED_LISTINGS: ListingWithImages[] = RAW.map((raw, i) =>
  toListing(raw, i)
);

export function filterSeedListings(
  filters: ListingFilters,
  limit = 100
): ListingWithImages[] {
  const filtered = applyListingFilters(SEED_LISTINGS, filters);
  const sorted = sortListings(filtered, filters.sort);
  return sorted.slice(0, limit);
}

export function getSeedListingById(id: string): ListingWithImages | null {
  return SEED_LISTINGS.find((l) => l.id === id) ?? null;
}

export function isSeedListing(id: string) {
  return id.startsWith("seed-");
}
