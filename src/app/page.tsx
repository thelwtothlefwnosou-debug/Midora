import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { WhyMidora } from "@/components/sections/WhyMidora";
import { StayByNeed } from "@/components/sections/StayByNeed";
import { RecentlyAddedListings } from "@/components/sections/RecentlyAddedListings";
import { RecentlyAddedSkeleton } from "@/components/sections/RecentlyAddedSkeleton";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PopularAreas } from "@/components/sections/PopularAreas";
import { HostCTA } from "@/components/sections/HostCTA";
import { FinalHomeCta } from "@/components/sections/FinalHomeCta";
import { PreviewSkipLink } from "@/components/preview/PreviewSkipLink";
import { isPreviewV80 } from "@/lib/preview-v80";
const HomeFAQ = dynamic(
  () => import("@/components/sections/HomeFAQ").then((m) => m.HomeFAQ)
);

export const revalidate = 60;

export default function Home() {
  return (
    <div className="midora-msearch-shell midora-msearch-shell--home">
      {isPreviewV80 && <PreviewSkipLink />}
      <Navbar variant="home" />
      <main id="main-content" className="overflow-x-hidden">
        <Hero />
        <HowItWorks />
        <Suspense fallback={<RecentlyAddedSkeleton />}>
          <RecentlyAddedListings />
        </Suspense>
        <StayByNeed />
        <HostCTA />
        <PopularAreas />
        <WhyMidora />
        <HomeFAQ />
        <FinalHomeCta />
      </main>
      <Footer />
    </div>
  );
}
