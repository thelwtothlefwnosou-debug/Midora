"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const InterestDateRangePicker = dynamic(
  () =>
    import("@/components/availability/InterestDateRangePicker").then(
      (m) => m.InterestDateRangePicker
    ),
  { ssr: false }
);

type Props = ComponentProps<typeof InterestDateRangePicker>;

/**
 * Loads the heavy calendar chunk only while the picker is open.
 * Closed state UI lives in the parent field — appearance unchanged.
 */
export function InterestDateRangePickerLazy(props: Props) {
  if (!props.open) return null;
  return <InterestDateRangePicker {...props} />;
}
