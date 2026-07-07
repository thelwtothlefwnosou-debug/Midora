type Props = {
  label: string | null;
};

/** Bottom-left availability date on listing cover — Blueground-style. */
export function ListingCardAvailabilityOverlay({ label }: Props) {
  if (!label) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end">
      <div className="w-full bg-gradient-to-t from-black/70 via-black/35 to-transparent px-2.5 pt-8 pb-2.5 sm:px-3 sm:pt-10 sm:pb-3">
        <p className="text-left text-[12px] font-bold leading-tight tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] sm:text-[13px]">
          {label}
        </p>
      </div>
    </div>
  );
}
