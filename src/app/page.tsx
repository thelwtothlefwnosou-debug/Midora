import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { WhyMidora } from "@/components/sections/WhyMidora";
import { StayByNeed } from "@/components/sections/StayByNeed";
import { RecentlyAddedListings } from "@/components/sections/RecentlyAddedListings";
import { RecentlyAddedSkeleton } from "@/components/sections/RecentlyAddedSkeleton";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PopularAreas } from "@/components/sections/PopularAreas";
import { HomeFAQ } from "@/components/sections/HomeFAQ";
import { HostCTA } from "@/components/sections/HostCTA";
import { HomeTrustMetric } from "@/components/sections/HomeTrustMetric";
import { PreviewSkipLink } from "@/components/preview/PreviewSkipLink";
import { isPreviewV80 } from "@/lib/preview-v80";

export const revalidate = 60;

export default function Home() {
  return (
    <>
      {isPreviewV80 && <PreviewSkipLink />}
      <Navbar />
      <main id="main-content" className="overflow-x-hidden">
        <Hero />
        {isPreviewV80 ? <HomeTrustMetric /> : <TrustStrip />}
        <Suspense fallback={<RecentlyAddedSkeleton />}>
          <RecentlyAddedListings />
        </Suspense>
        {!isPreviewV80 && <WhyMidora />}
        <HowItWorks />
        <StayByNeed />
        <PopularAreas />
        <HomeFAQ />
        <HostCTA />
      </main>
      <Footer />
    </>
  );
}
