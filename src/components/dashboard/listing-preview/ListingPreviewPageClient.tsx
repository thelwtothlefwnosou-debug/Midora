"use client";

import { useState } from "react";
import {
  ListingPreviewShell,
  type PreviewDevice,
} from "@/components/dashboard/listing-preview/ListingPreviewShell";
import type { ListingPreviewStatusMessage } from "@/lib/listing-preview-status";

type Props = {
  listingId: string;
  status: ListingPreviewStatusMessage;
  showPublicLink: boolean;
  publicHref: string;
  desktop: React.ReactNode;
};

export function ListingPreviewPageClient({
  listingId,
  status,
  showPublicLink,
  publicHref,
  desktop,
}: Props) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const mobileEmbedSrc = `/dashboard/listings/${listingId}/view?embed=mobile`;

  return (
    <ListingPreviewShell
      listingId={listingId}
      status={status}
      showPublicLink={showPublicLink}
      publicHref={publicHref}
      device={device}
      onDeviceChange={setDevice}
      mobileEmbedSrc={mobileEmbedSrc}
    >
      {desktop}
    </ListingPreviewShell>
  );
}
