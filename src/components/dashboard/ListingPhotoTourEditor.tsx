"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, ImageIcon, MoveRight, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { DeletePhotoButton } from "@/components/dashboard/DeletePhotoButton";
import {
  assignListingImageRoom,
  uploadListingRoomPhotos,
} from "@/lib/listing-photo-rooms";
import {
  getSuggestPhotoRooms,
  groupImagesByRoom,
  type PhotoRoomDef,
} from "@/lib/photo-rooms-catalog";
import { MAX_LISTING_PHOTOS } from "@/lib/constants";
import type { ListingImage, ListingWithImages } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingWithImages;
  existingImages: ListingImage[];
};

export function ListingPhotoTourEditor({ listing, existingImages }: Props) {
  const router = useRouter();
  const t = useTranslations("Workspace.photoTourEditor");
  const tPhotoRooms = useTranslations("Listing.photoRooms");
  const rooms = useMemo(
    () =>
      getSuggestPhotoRooms(
        { bedrooms: listing.bedrooms, bathrooms: listing.bathrooms },
        (key) => tPhotoRooms(key as Parameters<typeof tPhotoRooms>[0])
      ),
    [listing.bedrooms, listing.bathrooms, tPhotoRooms]
  );

  const photos = useMemo(
    () => existingImages.filter((img) => img.media_type !== "video"),
    [existingImages]
  );
  const videos = useMemo(
    () => existingImages.filter((img) => img.media_type === "video"),
    [existingImages]
  );

  const grouped = useMemo(
    () => groupImagesByRoom(existingImages, rooms, tPhotoRooms("generalPhotos")),
    [existingImages, rooms, tPhotoRooms]
  );

  const firstRoomWithPhotos = grouped[0]?.room.key ?? rooms[0]?.key ?? "living_room";
  const [activeRoom, setActiveRoom] = useState<string>(firstRoomWithPhotos);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const activeRoomDef = rooms.find((r) => r.key === activeRoom) ?? rooms[0];
  const activePhotos = photos.filter((p) => p.room_key === activeRoom);
  const unassignedPhotos = photos.filter((p) => !p.room_key);
  const totalCount = existingImages.length;
  const canUploadMore = totalCount < MAX_LISTING_PHOTOS;

  function countForRoom(key: string): number {
    if (key === "other") return unassignedPhotos.length;
    return photos.filter((p) => p.room_key === key).length;
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || activeRoom === "other") return;
    setError(null);
    setMessage(null);

    const fd = new FormData();
    Array.from(files).forEach((file) => fd.append("photos", file));

    startTransition(async () => {
      const result = await uploadListingRoomPhotos(listing.id, activeRoom, fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage(t("photosAdded", { room: activeRoomDef.label }));
      e.target.value = "";
      router.refresh();
    });
  }

  function handleMove(imageId: string, roomKey: string) {
    setError(null);
    startTransition(async () => {
      const result = await assignListingImageRoom(
        listing.id,
        imageId,
        roomKey || null
      );
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (roomKey) setActiveRoom(roomKey);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-charcoal">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {t("subtitle")}
        </p>
        <p className="mt-1 text-xs text-muted">
          {t("countPhotos", { count: photos.length })}
          {videos.length > 0 ? ` · ${t("countVideos", { count: videos.length })}` : ""}
          {" · "}
          {t("maxFiles", { max: MAX_LISTING_PHOTOS })}
        </p>
      </div>

      <Link
        href={`/dashboard/listings/${listing.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToManage")}
      </Link>

      <GlassCard className="overflow-hidden p-0">
        <div className="grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
          <aside className="border-b border-border bg-sand/20 p-4 lg:border-r lg:border-b-0">
            <p className="mb-3 text-[10px] font-semibold tracking-wide text-muted uppercase">
              {t("rooms")}
            </p>
            <ul className="space-y-1">
              {rooms.map((room) => {
                const count = countForRoom(room.key);
                const isActive = activeRoom === room.key;
                return (
                  <li key={room.key}>
                    <button
                      type="button"
                      onClick={() => setActiveRoom(room.key)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        isActive
                          ? "bg-charcoal text-white shadow-soft"
                          : "text-charcoal/80 hover:bg-white"
                      )}
                    >
                      <span className="font-medium">{room.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                          isActive ? "bg-gold text-charcoal" : "bg-white text-muted"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
              {unassignedPhotos.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoom("other")}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      activeRoom === "other"
                        ? "bg-charcoal text-white shadow-soft"
                        : "text-amber-800 hover:bg-amber-50"
                    )}
                  >
                    <span className="font-medium">{t("uncategorized")}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                        activeRoom === "other" ? "bg-gold text-charcoal" : "bg-white text-amber-900"
                      )}
                    >
                      {unassignedPhotos.length}
                    </span>
                  </button>
                </li>
              )}
            </ul>
          </aside>

          <div className="p-5 sm:p-6">
            {activeRoom === "other" ? (
              <UnassignedPanel
                photos={unassignedPhotos}
                rooms={rooms}
                listingId={listing.id}
                onMove={handleMove}
                pending={pending}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-charcoal">
                      {activeRoomDef.label}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {activePhotos.length === 0
                        ? t("noPhotosForRoom")
                        : t("countPhotos", { count: activePhotos.length })}
                    </p>
                  </div>
                  {canUploadMore && (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold-dark">
                      <Upload className="h-4 w-4" />
                      {t("addPhotos")}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleUpload}
                        disabled={pending}
                      />
                    </label>
                  )}
                </div>

                {activePhotos.length === 0 ? (
                  <label className="mt-6 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-sand/20 px-6 py-14 transition-colors hover:border-gold/40">
                    <Camera className="h-10 w-10 text-gold/60" />
                    <span className="text-sm font-medium text-charcoal">
                      {t("uploadForRoom", { room: activeRoomDef.label })}
                    </span>
                    <span className="text-xs text-muted">{t("fileTypesHint")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUpload}
                      disabled={pending || !canUploadMore}
                    />
                  </label>
                ) : (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {activePhotos.map((img) => (
                      <PhotoTile
                        key={img.id}
                        image={img}
                        listingId={listing.id}
                        rooms={rooms}
                        currentRoom={activeRoom}
                        onMove={handleMove}
                        pending={pending}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            {message && <p className="mt-4 text-sm text-teal">{message}</p>}
            {pending && <p className="mt-2 text-xs text-muted">{t("saving")}</p>}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function PhotoTile({
  image,
  listingId,
  rooms,
  currentRoom,
  onMove,
  pending,
}: {
  image: ListingImage;
  listingId: string;
  rooms: PhotoRoomDef[];
  currentRoom: string;
  onMove: (imageId: string, roomKey: string) => void;
  pending: boolean;
}) {
  const t = useTranslations("Workspace.photoTourEditor");
  const [moveOpen, setMoveOpen] = useState(false);

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-sand/30">
      <Image src={image.url} alt="" fill className="object-cover" sizes="200px" />
      <DeletePhotoButton listingId={listingId} imageId={image.id} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setMoveOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-white/95 py-1.5 text-[11px] font-medium text-charcoal"
        >
          <MoveRight className="h-3 w-3" />
          {t("move")}
        </button>
      </div>
      {moveOpen && (
        <div className="absolute inset-0 z-10 flex flex-col bg-charcoal/90 p-2">
          <p className="mb-2 text-center text-[10px] font-medium text-white">{t("moveTo")}</p>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {rooms
              .filter((r) => r.key !== currentRoom)
              .map((room) => (
                <button
                  key={room.key}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    onMove(image.id, room.key);
                    setMoveOpen(false);
                  }}
                  className="block w-full rounded-lg bg-white/10 px-2 py-1.5 text-left text-[11px] text-white hover:bg-white/20"
                >
                  {room.label}
                </button>
              ))}
          </div>
          <button
            type="button"
            onClick={() => setMoveOpen(false)}
            className="mt-2 text-center text-[10px] text-white/70"
          >
            {t("close")}
          </button>
        </div>
      )}
    </div>
  );
}

function UnassignedPanel({
  photos,
  rooms,
  listingId,
  onMove,
  pending,
}: {
  photos: ListingImage[];
  rooms: PhotoRoomDef[];
  listingId: string;
  onMove: (imageId: string, roomKey: string) => void;
  pending: boolean;
}) {
  const t = useTranslations("Workspace.photoTourEditor");
  return (
    <div>
      <h3 className="font-display text-base font-semibold text-charcoal">
        {t("unassignedTitle")}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {t("unassignedSubtitle")}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {photos.map((img) => (
          <div
            key={img.id}
            className="flex gap-3 rounded-xl border border-border bg-white p-3"
          >
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
              <Image src={img.url} alt="" fill className="object-cover" sizes="112px" />
            </div>
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-medium text-muted uppercase">
                {t("assignToRoom")}
              </label>
              <select
                defaultValue=""
                disabled={pending}
                onChange={(e) => {
                  if (e.target.value) onMove(img.id, e.target.value);
                }}
                className="mt-1 w-full rounded-lg border border-border bg-sand/30 px-2 py-2 text-sm text-charcoal"
              >
                <option value="">{t("selectRoom")}</option>
                {rooms.map((room) => (
                  <option key={room.key} value={room.key}>
                    {room.label}
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <DeletePhotoButton listingId={listingId} imageId={img.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {photos.length === 0 && (
        <p className="mt-6 flex items-center gap-2 text-sm text-teal">
          <ImageIcon className="h-4 w-4" />
          {t("allAssigned")}
        </p>
      )}
    </div>
  );
}
