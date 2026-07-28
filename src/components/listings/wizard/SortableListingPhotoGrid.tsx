"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, Trash2 } from "lucide-react";
import { isCoverPhoto, roomBadgeLabel } from "@/lib/listing-photo-display";
import { type PhotoRoomDef } from "@/lib/photo-rooms-catalog";
import type { ListingImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  images: ListingImage[];
  isManager: boolean;
  rooms: PhotoRoomDef[];
  selectedIds: Set<string>;
  pending: boolean;
  isProcessingQueue: boolean;
  /** Live grid reorder while dragging (no server write). */
  onLiveReorder: (next: ListingImage[]) => void;
  /** Persist current order after successful drop. */
  onPersistOrder: () => void;
  onToggleSelected: (id: string) => void;
  onSetCover: (id: string) => void;
  onMoveToStart: (id: string) => void;
  onCaption: (id: string, current?: string | null) => void;
  onAssignRoom: (id: string, roomKey: string) => void;
  onDelete: (id: string) => void;
};

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: "0.4" },
    },
  }),
};

function SortablePhotoCard({
  img,
  index,
  isManager,
  rooms,
  selected,
  pending,
  isProcessingQueue,
  isDragging,
  onToggleSelected,
  onSetCover,
  onMoveToStart,
  onCaption,
  onAssignRoom,
  onDelete,
}: {
  img: ListingImage;
  index: number;
  isManager: boolean;
  rooms: PhotoRoomDef[];
  selected: boolean;
  pending: boolean;
  isProcessingQueue: boolean;
  isDragging: boolean;
  onToggleSelected: (id: string) => void;
  onSetCover: (id: string) => void;
  onMoveToStart: (id: string) => void;
  onCaption: (id: string, current?: string | null) => void;
  onAssignRoom: (id: string, roomKey: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("Wizard.photos");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: img.id });

  const cover = isCoverPhoto(img, index);
  const roomLabel = roomBadgeLabel(img.room_key);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-white shadow-soft",
        (isDragging || isSortableDragging) && "opacity-40 ring-2 ring-gold/40"
      )}
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={img.url}
          alt={img.caption ?? img.file_name ?? t("photoAlt")}
          fill
          draggable={false}
          className="pointer-events-none object-cover"
          sizes="(max-width: 768px) 50vw, 240px"
        />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-charcoal">
          #{index + 1}
        </span>
        {cover && (
          <span className="absolute left-2 top-9 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-white">
            {isManager ? t("coverManager") : t("cover")}
          </span>
        )}
        {roomLabel && (
          <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-full bg-charcoal/80 px-2 py-0.5 text-[10px] font-medium text-white">
            {roomLabel}
          </span>
        )}
        <label
          className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-white/90 shadow"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-gold"
            checked={selected}
            onChange={() => onToggleSelected(img.id)}
          />
        </label>
        <button
          type="button"
          className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1.5 text-[11px] font-medium text-charcoal shadow-md touch-none cursor-grab active:cursor-grabbing"
          aria-label={t("dragAria", { index: index + 1 })}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gold" aria-hidden />
          {t("drag")}
        </button>
      </div>
      {img.caption && (
        <p className="truncate border-t border-border px-3 py-1.5 text-xs text-muted">
          {img.caption}
        </p>
      )}
      <div
        className="flex flex-wrap items-center justify-end gap-1 border-t border-border px-2 py-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {!cover && (
          <button
            type="button"
            disabled={pending || isProcessingQueue}
            onClick={() => onSetCover(img.id)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-charcoal hover:bg-sand disabled:opacity-40"
          >
            <Star className="h-3.5 w-3.5" />
            {isManager ? t("coverManager") : t("cover")}
          </button>
        )}
        {isManager && index > 0 && (
          <button
            type="button"
            disabled={pending || isProcessingQueue}
            onClick={() => onMoveToStart(img.id)}
            className="rounded px-2 py-1 text-[11px] text-charcoal hover:bg-sand disabled:opacity-40"
          >
            {t("moveToStart")}
          </button>
        )}
        {isManager && (
          <button
            type="button"
            disabled={pending || isProcessingQueue}
            onClick={() => onCaption(img.id, img.caption)}
            className="rounded px-2 py-1 text-[11px] text-charcoal hover:bg-sand disabled:opacity-40"
          >
            {t("caption")}
          </button>
        )}
        {rooms.length > 0 && (
          <select
            value={img.room_key ?? ""}
            onChange={(e) => onAssignRoom(img.id, e.target.value)}
            className="max-w-[8.5rem] rounded border border-border px-1 py-0.5 text-[10px]"
            aria-label={t("roomAria")}
          >
            <option value="">{t("noRoom")}</option>
            {rooms.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          disabled={pending || isProcessingQueue}
          onClick={() => onDelete(img.id)}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("delete")}
        </button>
      </div>
    </div>
  );
}

function PhotoOverlayCard({
  img,
  index,
  isManager,
}: {
  img: ListingImage;
  index: number;
  isManager: boolean;
}) {
  const t = useTranslations("Wizard.photos");
  const cover = isCoverPhoto(img, index);
  return (
    <div className="w-[220px] overflow-hidden rounded-xl border border-gold/50 bg-white shadow-2xl ring-2 ring-gold/30 scale-105 rotate-1">
      <div className="relative aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-charcoal">
          #{index + 1}
        </span>
        {cover && (
          <span className="absolute left-2 top-9 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-white">
            {isManager ? t("coverManager") : t("cover")}
          </span>
        )}
      </div>
    </div>
  );
}

export function SortableListingPhotoGrid({
  images,
  isManager,
  rooms,
  selectedIds,
  pending,
  isProcessingQueue,
  onLiveReorder,
  onPersistOrder,
  onToggleSelected,
  onSetCover,
  onMoveToStart,
  onCaption,
  onAssignRoom,
  onDelete,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const [dragSnapshot, setDragSnapshot] = useState<ListingImage[] | null>(null);
  const ids = useMemo(() => images.map((i) => i.id), [images]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const activeImage = activeId ? images.find((i) => i.id === activeId) : null;
  const activeIndex = activeId ? images.findIndex((i) => i.id === activeId) : -1;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setOrderDirty(false);
    setDragSnapshot(images);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    setOrderDirty(true);
    onLiveReorder(arrayMove(images, oldIndex, newIndex));
  }

  function handleDragEnd() {
    setActiveId(null);
    if (orderDirty) {
      onPersistOrder();
    }
    setOrderDirty(false);
    setDragSnapshot(null);
  }

  function handleDragCancel() {
    if (dragSnapshot) {
      onLiveReorder(dragSnapshot);
    }
    setActiveId(null);
    setOrderDirty(false);
    setDragSnapshot(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div
          className={cn(
            "grid gap-4",
            isManager ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {images.map((img, index) => (
            <SortablePhotoCard
              key={img.id}
              img={img}
              index={index}
              isManager={isManager}
              rooms={rooms}
              selected={selectedIds.has(img.id)}
              pending={pending}
              isProcessingQueue={isProcessingQueue}
              isDragging={activeId === img.id}
              onToggleSelected={onToggleSelected}
              onSetCover={onSetCover}
              onMoveToStart={onMoveToStart}
              onCaption={onCaption}
              onAssignRoom={onAssignRoom}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeImage && activeIndex >= 0 ? (
          <PhotoOverlayCard
            img={activeImage}
            index={activeIndex}
            isManager={isManager}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
