"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bed, Camera, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { uploadListingRoomPhotos } from "@/lib/listing-photo-rooms";
import { roomBedSummary } from "@/lib/listing-photo-room-details";
import {
  groupImagesByRoom,
  suggestPhotoRooms,
  type PhotoRoomDef,
} from "@/lib/photo-rooms-catalog";
import type {
  ListingImage,
  ListingSleepingArrangement,
  ListingWithImages,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingWithImages;
  images: ListingImage[];
  sleepingArrangements: ListingSleepingArrangement[];
  onEditRoom?: (roomKey: string) => void;
};

export function ListingHouseTourPanel({
  listing,
  images,
  sleepingArrangements,
  onEditRoom,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rooms = useMemo(
    () => suggestPhotoRooms({ bedrooms: listing.bedrooms, bathrooms: listing.bathrooms }),
    [listing.bedrooms, listing.bathrooms]
  );

  const grouped = useMemo(() => groupImagesByRoom(images, rooms), [images, rooms]);

  const countByRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of grouped) map.set(g.room.key, g.images.length);
    return map;
  }, [grouped]);

  function handleUpload(roomKey: string, files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("photos", f));
    startTransition(async () => {
      const result = await uploadListingRoomPhotos(listing.id, roomKey, fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setActiveRoom(null);
      router.refresh();
    });
  }

  return (
    <GlassCard className="p-4 sm:p-5">
      <h2 className="font-display text-base font-semibold text-charcoal">Περιήγηση σπιτιού</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Οργάνωσε το ακίνητο ανά χώρο — εμφανίζεται στη δημόσια αγγελία.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard
            key={room.key}
            room={room}
            photoCount={countByRoom.get(room.key) ?? 0}
            coverUrl={grouped.find((g) => g.room.key === room.key)?.images[0]?.url}
            detail={roomBedSummary(room, sleepingArrangements)}
            isActive={activeRoom === room.key}
            pending={pending && activeRoom === room.key}
            onOpen={() => {
              setActiveRoom(room.key);
              onEditRoom?.(room.key);
            }}
            onUpload={(files) => handleUpload(room.key, files)}
          />
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </GlassCard>
  );
}

function RoomCard({
  room,
  photoCount,
  coverUrl,
  detail,
  isActive,
  pending,
  onOpen,
  onUpload,
}: {
  room: PhotoRoomDef;
  photoCount: number;
  coverUrl?: string;
  detail: string | null;
  isActive: boolean;
  pending: boolean;
  onOpen: () => void;
  onUpload: (files: FileList | null) => void;
}) {
  const isEmpty = photoCount === 0;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-soft transition-colors",
        isActive ? "border-gold/40 ring-1 ring-gold/20" : "border-border hover:border-gold/25"
      )}
    >
      <div className={cn("relative bg-sand/30", isEmpty ? "aspect-[3/2]" : "aspect-[4/3]")}>
        {coverUrl ? (
          <Image src={coverUrl} alt={room.label} fill className="object-cover" sizes="360px" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center">
            <Bed className="h-5 w-5 text-gold/40" />
            <span className="text-[10px] leading-snug text-muted">
              Δεν υπάρχουν φωτογραφίες για αυτόν τον χώρο.
            </span>
          </div>
        )}
        {photoCount > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-charcoal/85 px-2 py-0.5 text-[10px] font-semibold text-white">
            {photoCount}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="font-display text-sm font-semibold text-charcoal">{room.label}</h3>
        {detail && <p className="mt-0.5 text-xs text-muted">{detail}</p>}
        {!isEmpty && (
          <p className="mt-0.5 text-[11px] text-muted">
            {photoCount === 1 ? "1 φωτογραφία" : `${photoCount} φωτογραφίες`}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {!isEmpty && (
            <button
              type="button"
              onClick={onOpen}
              className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-charcoal hover:bg-sand"
            >
              Επεξεργασία χώρου
            </button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-charcoal px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-charcoal/90">
            {isEmpty ? (
              <>
                <Camera className="h-3 w-3" />
                Πρόσθεσε φωτογραφίες
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                {pending ? "Ανέβασμα…" : "Πρόσθεσε"}
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              disabled={pending}
              onChange={(e) => onUpload(e.target.files)}
            />
          </label>
        </div>
      </div>
    </article>
  );
}
