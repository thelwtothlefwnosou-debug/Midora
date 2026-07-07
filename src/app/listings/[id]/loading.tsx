import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingDetailSkeleton } from "@/components/ui/PageSkeleton";

export default function ListingDetailLoading() {
  return (
    <>
      <Navbar />
      <ListingDetailSkeleton />
      <Footer />
    </>
  );
}
