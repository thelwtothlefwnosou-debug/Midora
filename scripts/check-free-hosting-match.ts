import {
  offerMatchesRequestedStay,
  requestedNightsWithinMax,
  requestedStayFitsOffer,
} from "../src/lib/free-hosting-match";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
  console.log("OK", msg);
}

const offer = {
  startDate: "2026-08-10",
  endExclusive: "2026-08-20",
  maxNights: 5,
  maxGuests: 2,
};
const periods = [{ start_date: "2026-08-15", end_date: "2026-08-16" }];

assert(requestedStayFitsOffer("2026-08-10", "2026-08-15", offer), "half-open fit");
assert(!requestedStayFitsOffer("2026-08-10", "2026-08-21", offer), "half-open outside");
assert(requestedNightsWithinMax("2026-08-10", "2026-08-15", 5), "nights ok");
assert(!requestedNightsWithinMax("2026-08-10", "2026-08-17", 5), "nights > max");
assert(offerMatchesRequestedStay(offer, "2026-08-10", "2026-08-14", 2, []), "match ok");
assert(!offerMatchesRequestedStay(offer, "2026-08-10", "2026-08-14", 3, []), "guests > max");
assert(
  !offerMatchesRequestedStay(offer, "2026-08-14", "2026-08-16", 2, periods),
  "manual block conflict"
);

console.log("targeted free-hosting-match checks PASS");
