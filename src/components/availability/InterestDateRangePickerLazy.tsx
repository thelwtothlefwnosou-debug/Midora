"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentProps } from "react";

const loadPicker = () =>
  import("@/components/availability/InterestDateRangePicker").then(
    (m) => m.InterestDateRangePicker
  );

const InterestDateRangePicker = dynamic(loadPicker, { ssr: false });

type Props = ComponentProps<typeof InterestDateRangePicker>;

/** Warm the calendar chunk so the first open does not flash open/close. */
export function prefetchInterestDateRangePicker() {
  void loadPicker();
}

/**
 * Loads the heavy calendar on demand, but keeps it mounted after the first open
 * so open/close does not remount and race with outside-click handlers.
 */
export function InterestDateRangePickerLazy(props: Props) {
  const [mounted, setMounted] = useState(props.open);

  useEffect(() => {
    if (props.open) setMounted(true);
  }, [props.open]);

  useEffect(() => {
    const idle = window.setTimeout(() => {
      void loadPicker();
    }, 800);
    return () => window.clearTimeout(idle);
  }, []);

  if (!mounted && !props.open) return null;
  return <InterestDateRangePicker {...props} />;
}
