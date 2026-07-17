import { redirect } from "next/navigation";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";

/** Legacy path — always send owners to the wizard. */
export default function CreateListingRedirectPage() {
  redirect(OWNER_LISTING_NEW_PATH);
}
