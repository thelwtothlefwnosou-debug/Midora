"use client";

import { useLayoutEffect, useState } from "react";
import { PropertyContactModal } from "@/components/listings/detail/PropertyContactModal";
import {
  useListingInterest,
  type InterestPrefill,
} from "@/components/listings/ListingInterestContext";
import type { ListingWithImages } from "@/lib/types";

type Props = {
  listing: ListingWithImages;
  defaultContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export function ListingInterestBridge({ listing, defaultContact }: Props) {
  const { registerOpener } = useListingInterest();
  const [open, setOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [prefill, setPrefill] = useState<InterestPrefill | undefined>();

  useLayoutEffect(() => {
    registerOpener((nextPrefill) => {
      setPrefill(nextPrefill);
      setSessionKey((k) => k + 1);
      setOpen(true);
    });
    return () => registerOpener(null);
  }, [registerOpener]);

  return (
    <PropertyContactModal
      listing={listing}
      open={open}
      onClose={() => setOpen(false)}
      sessionKey={sessionKey}
      defaultContact={defaultContact}
      prefill={prefill}
    />
  );
}
