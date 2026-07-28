"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Camera,
  Images,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  deleteListingPhoto,
  deleteListingPhotosBulk,
  getOwnerListingImages,
  getSavedListingImageCount,
  reorderListingPhotos,
  setListingCoverPhoto,
  uploadWizardListingPhoto,
} from "@/lib/actions";
import {
  assignListingImageRoom,
  bulkAssignListingImagesRoom,
  updateListingImageCaption,
} from "@/lib/listing-photo-rooms";
import { SortableListingPhotoGrid } from "@/components/listings/wizard/SortableListingPhotoGrid";
import { type PhotoRoomDef } from "@/lib/photo-rooms-catalog";
import { MIN_LISTING_PHOTOS_FOR_REVIEW, MIN_LISTING_PHOTOS_REQUIRED, PHOTO_UPLOAD_CONCURRENCY } from "@/lib/constants";
import {
  logListingImageValidationDebug,
  photoCountStatusInfo,
} from "@/lib/listing-photo-validation";
import {
  ACCEPTED_LISTING_PHOTO_ACCEPT,
  partitionListingPhotoFiles,
} from "@/lib/listing-photo-upload";
import type { ListingImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  initialImages: ListingImage[];
  /** Known saved count from draft load — used to avoid empty flash while refetching. */
  initialPhotoCount?: number;
  /** Parent already loaded photos (SSR/draft) — skip first-paint empty state. */
  photosAlreadyHydrated?: boolean;
  onPhotoCountChange?: () => void;
  onUploadBusyChange?: (busy: boolean) => void;
  onImagesChange?: (images: ListingImage[]) => void;
  stepHeadingRef?: RefObject<HTMLHeadingElement | null>;
  variant?: "wizard" | "manager";
  rooms?: PhotoRoomDef[];
  hideHeading?: boolean;
};

type QueueStatus = "waiting" | "uploading" | "uploaded" | "failed";

type UploadQueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  status: QueueStatus;
  error?: string;
};

function sortPhotos(items: ListingImage[]) {
  return [...items]
    .filter((i) => i.media_type !== "video")
    .sort((a, b) => a.sort_order - b.sort_order);
}

const UPLOAD_TIMEOUT_MS = 90_000;

function uploadWithTimeout<T>(promise: Promise<T>, ms = UPLOAD_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("UPLOAD_TIMEOUT")), ms);
    }),
  ]);
}

export function ListingWizardPhotosStep({
  listingId,
  initialImages,
  initialPhotoCount = 0,
  photosAlreadyHydrated = false,
  onPhotoCountChange,
  onUploadBusyChange,
  onImagesChange,
  stepHeadingRef,
  variant = "wizard",
  rooms = [],
  hideHeading = false,
}: Props) {
  const t = useTranslations("Wizard.photos");
  const tErrors = useTranslations("Wizard.errors");
  const locale = useLocale();
  const isManager = variant === "manager";

  const statusLabel: Record<QueueStatus, string> = {
    waiting: t("pending"),
    uploading: t("uploading"),
    uploaded: t("added"),
    failed: t("failed"),
  };
  const [images, setImages] = useState(() => sortPhotos(initialImages));
  const [savedImageCount, setSavedImageCount] = useState(() =>
    Math.max(initialPhotoCount, sortPhotos(initialImages).length)
  );
  const [photosHydrated, setPhotosHydrated] = useState(photosAlreadyHydrated);
  const [photosLoading, setPhotosLoading] = useState(!photosAlreadyHydrated);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [orderSaveStatus, setOrderSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [uploadStats, setUploadStats] = useState({ uploaded: 0, total: 0 });
  const orderBeforePersistRef = useRef<ListingImage[] | null>(null);
  const persistGenerationRef = useRef(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [pending, startTransition] = useTransition();
  const listingIdRef = useRef(listingId);
  const imagesRef = useRef(images);
  const onImagesChangeRef = useRef(onImagesChange);
  onImagesChangeRef.current = onImagesChange;
  imagesRef.current = images;

  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const dragDepthRef = useRef(0);
  const pendingWorkRef = useRef<UploadQueueItem[]>([]);
  const processingRef = useRef(false);
  const uploadQueueRef = useRef(uploadQueue);

  useEffect(() => {
    uploadQueueRef.current = uploadQueue;
  }, [uploadQueue]);

  useEffect(() => {
    onUploadBusyChange?.(isProcessingQueue);
  }, [isProcessingQueue, onUploadBusyChange]);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const preventDefault = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);

    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  const refreshImages = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = opts?.soft === true || imagesRef.current.length > 0;
    const startedAt = performance.now();
    if (!soft) {
      setPhotosLoading(true);
    }

    const [imagesResult, countResult] = await Promise.all([
      getOwnerListingImages(listingId),
      getSavedListingImageCount(listingId),
    ]);

    if (listingIdRef.current !== listingId) return [];

    const savedCount =
      "photoCount" in countResult && typeof countResult.photoCount === "number"
        ? countResult.photoCount
        : 0;
    setSavedImageCount(savedCount);

    let photos: ListingImage[] = [];
    if ("images" in imagesResult && imagesResult.images) {
      photos = sortPhotos(imagesResult.images);
      setImages(photos);
      onImagesChangeRef.current?.(photos);
    } else if (!soft) {
      setImages([]);
      onImagesChangeRef.current?.([]);
    }

    if (process.env.NODE_ENV === "development") {
      console.debug("[MIDORA_PHOTO_LOAD_TIMING]", {
        draftId: listingId,
        metadataFetchMs: Math.round(performance.now() - startedAt),
        photoCount: photos.length || savedCount,
        soft,
      });
    }

    logListingImageValidationDebug({
      listingId,
      savedImageCount: savedCount,
      localPhotoCount: photos.length,
      pendingUploads: uploadQueueRef.current.filter(
        (item) => item.status === "waiting" || item.status === "uploading"
      ).length,
      failedUploads: uploadQueueRef.current.filter((item) => item.status === "failed")
        .length,
    });

    setPhotosHydrated(true);
    setPhotosLoading(false);
    onPhotoCountChange?.();
    return photos;
  }, [listingId, onPhotoCountChange]);

  useEffect(() => {
    listingIdRef.current = listingId;
  }, [listingId]);

  useEffect(() => {
    // Seed from parent without clearing; soft-refresh in background.
    const seeded = sortPhotos(initialImages);
    if (seeded.length > 0) {
      setImages(seeded);
      setSavedImageCount((prev) => Math.max(prev, seeded.length, initialPhotoCount));
      setPhotosHydrated(true);
      setPhotosLoading(false);
      void refreshImages({ soft: true });
      return;
    }
    if (photosAlreadyHydrated) {
      setPhotosHydrated(true);
      setPhotosLoading(false);
      void refreshImages({ soft: true });
      return;
    }
    void refreshImages({ soft: false });
  }, [listingId, refreshImages]); // eslint-disable-line react-hooks/exhaustive-deps -- remount/fetch per listingId only

  const updateQueueItem = useCallback(
    (id: string, patch: Partial<UploadQueueItem>) => {
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const releasePreviewUrl = useCallback((previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current = previewUrlsRef.current.filter((u) => u !== previewUrl);
  }, []);

  const handleDismissQueueItem = useCallback(
    (item: UploadQueueItem) => {
      pendingWorkRef.current = pendingWorkRef.current.filter((i) => i.id !== item.id);
      releasePreviewUrl(item.previewUrl);
      setUploadQueue((prev) => prev.filter((i) => i.id !== item.id));

      const countedInUploadStats =
        item.status === "waiting" ||
        item.status === "uploading" ||
        (item.status === "failed" && !item.id.startsWith("reject-"));

      if (countedInUploadStats) {
        setUploadStats((prev) => ({
          uploaded: prev.uploaded,
          total: Math.max(prev.uploaded, prev.total - 1),
        }));
      }
    },
    [releasePreviewUrl]
  );

  const uploadSingleQueueItem = useCallback(
    async (item: UploadQueueItem) => {
      updateQueueItem(item.id, { status: "uploading", error: undefined });

      try {
        const fd = new FormData();
        fd.append("photo", item.file);

        const result = await uploadWithTimeout(
          uploadWizardListingPhoto(listingId, fd)
        );

        if (result.error) {
          updateQueueItem(item.id, {
            status: "failed",
            error: result.error ?? "saveFailed",
          });
          return false;
        }

        updateQueueItem(item.id, {
          status: "uploaded",
          error: undefined,
        });
        setUploadStats((prev) => ({
          ...prev,
          uploaded: prev.uploaded + 1,
        }));
        return true;
      } catch (err) {
        const timedOut =
          err instanceof Error && err.message === "UPLOAD_TIMEOUT";
        updateQueueItem(item.id, {
          status: "failed",
          error: timedOut ? "uploadTimeout" : "uploadUnexpected",
        });
        return false;
      }
    },
    [listingId, updateQueueItem]
  );

  const processQueueItems = useCallback(
    async (items: UploadQueueItem[], options?: { countTowardTotal?: boolean }) => {
      if (items.length === 0) return;

      pendingWorkRef.current.push(...items);

      if (options?.countTowardTotal !== false) {
        setUploadStats((prev) => ({
          uploaded: prev.uploaded,
          total: prev.total + items.length,
        }));
      }

      if (processingRef.current) return;

      processingRef.current = true;
      setIsProcessingQueue(true);
      setError(null);

      try {
        while (pendingWorkRef.current.length > 0) {
          const batch = pendingWorkRef.current.splice(0);
          let index = 0;

          async function worker() {
            while (index < batch.length) {
              const current = batch[index];
              index += 1;
              await uploadSingleQueueItem(current);
            }
          }

          await Promise.all(
            Array.from({ length: PHOTO_UPLOAD_CONCURRENCY }, () => worker())
          );
        }

        await refreshImages();
      } finally {
        processingRef.current = false;
        setIsProcessingQueue(false);

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.status === "uploading"
              ? {
                  ...item,
                  status: "failed" as const,
                  error: "uploadInterrupted",
                }
              : item
          )
        );

        if (pendingWorkRef.current.length > 0) {
          void processQueueItems([], { countTowardTotal: false });
        }
      }
    },
    [refreshImages, uploadSingleQueueItem]
  );

  const enqueueFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const { valid, rejected, globalErrors } = partitionListingPhotoFiles(files, locale);
      setValidationErrors(globalErrors);

      const rejectedItems: UploadQueueItem[] = rejected.map((entry, index) => {
        const previewUrl = URL.createObjectURL(entry.file);
        previewUrlsRef.current.push(previewUrl);
        return {
          id: `reject-${Date.now()}-${index}-${entry.file.name}`,
          file: entry.file,
          previewUrl,
          name: entry.file.name,
          status: "failed" as const,
          error: entry.message,
        };
      });

      const newItems: UploadQueueItem[] = valid.map((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.push(previewUrl);
        return {
          id: `${Date.now()}-${index}-${file.name}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl,
          name: file.name,
          status: "waiting",
        };
      });

      if (rejectedItems.length > 0) {
        setUploadQueue((prev) => [...prev, ...rejectedItems]);
      }

      if (newItems.length === 0) return;

      setUploadQueue((prev) => [...prev, ...newItems]);
      void processQueueItems(newItems);
    },
    [processQueueItems]
  );

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    enqueueFiles(files);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setDragActive(true);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files ?? []);
    enqueueFiles(files);
  }

  function handleRetryItem(item: UploadQueueItem) {
    void processQueueItems(
      [{ ...item, status: "waiting", error: undefined }],
      { countTowardTotal: false }
    );
  }

  function handleRetryFailed() {
    const failed = uploadQueue.filter((item) => item.status === "failed");
    if (failed.length === 0) return;
    void processQueueItems(
      failed.map((item) => ({ ...item, status: "waiting", error: undefined })),
      { countTowardTotal: false }
    );
  }

  function handleDelete(imageId: string) {
    if (isManager) {
      const confirmed = window.confirm(t("confirmDelete"));
      if (!confirmed) return;
    }
    startTransition(async () => {
      const result = await deleteListingPhoto(listingId, imageId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
      await refreshImages();
    });
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      t("confirmBulkDelete", { count: selectedIds.size })
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteListingPhotosBulk(listingId, [...selectedIds]);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSelectedIds(new Set());
      await refreshImages();
    });
  }

  function handleSetCover(imageId: string) {
    startTransition(async () => {
      const result = await setListingCoverPhoto(listingId, imageId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setImages((prev) =>
        sortPhotos(
          prev.map((img) => ({
            ...img,
            is_cover: img.id === imageId,
          }))
        )
      );
      await refreshImages();
    });
  }

  function handleBulkAssignRoom(roomKey: string) {
    if (selectedIds.size === 0) return;
    const key = roomKey || null;
    startTransition(async () => {
      const result = await bulkAssignListingImagesRoom(listingId, [...selectedIds], key);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSelectedIds(new Set());
      await refreshImages();
    });
  }

  function handleAssignRoom(imageId: string, roomKey: string) {
    const key = roomKey || null;
    startTransition(async () => {
      const result = await assignListingImageRoom(listingId, imageId, key);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      await refreshImages();
    });
  }

  function handleCaption(imageId: string, current?: string | null) {
    const next = window.prompt(t("captionPrompt"), current ?? "");
    if (next === null) return;
    startTransition(async () => {
      const result = await updateListingImageCaption(listingId, imageId, next);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      await refreshImages();
    });
  }

  function handleMoveToStart(imageId: string) {
    const idx = images.findIndex((i) => i.id === imageId);
    if (idx <= 0) return;
    const next = [...images];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    orderBeforePersistRef.current = images;
    setImages(next);
    void persistOrder(next);
  }

  function handleLiveReorder(next: ListingImage[]) {
    setImages((prev) => {
      if (!orderBeforePersistRef.current) {
        orderBeforePersistRef.current = prev;
      } else if (
        orderBeforePersistRef.current.length === next.length &&
        orderBeforePersistRef.current.every((img, i) => img.id === next[i]?.id)
      ) {
        orderBeforePersistRef.current = null;
      }
      return next;
    });
  }

  async function persistOrder(next: ListingImage[]) {
    const generation = ++persistGenerationRef.current;
    const rollback = orderBeforePersistRef.current ?? next;
    setOrderSaveStatus("saving");
    const result = await reorderListingPhotos(
      listingId,
      next.map((i) => i.id)
    );
    if (generation !== persistGenerationRef.current) return;
    if (result && "error" in result && result.error) {
      setImages(rollback);
      orderBeforePersistRef.current = null;
      setError(result.error);
      setOrderSaveStatus("error");
      return;
    }
    // Keep first photo as cover for consistent badge ↔ #1.
    const first = next[0];
    if (first && first.is_cover !== true) {
      const coverResult = await setListingCoverPhoto(listingId, first.id);
      if (coverResult && "error" in coverResult && coverResult.error) {
        setError(coverResult.error);
      } else {
        setImages((prev) =>
          prev.map((img, i) => ({
            ...img,
            is_cover: i === 0,
          }))
        );
      }
    }
    orderBeforePersistRef.current = null;
    setOrderSaveStatus("saved");
    window.setTimeout(() => {
      if (persistGenerationRef.current === generation) {
        setOrderSaveStatus("idle");
      }
    }, 1600);
  }

  function handlePersistOrder() {
    void persistOrder(images);
  }

  function toggleSelected(imageId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });
  }

  const failedCount = uploadQueue.filter((i) => i.status === "failed").length;
  const activeUploads = uploadQueue.filter(
    (i) => i.status === "waiting" || i.status === "uploading"
  ).length;
  const showLoadingShell =
    uploadQueue.length === 0 &&
    images.length === 0 &&
    (!photosHydrated || photosLoading || savedImageCount > 0);
  const photoStatus = photoCountStatusInfo(savedImageCount);

  function translatePhotoItemError(msg: string | undefined): string | undefined {
    if (!msg) return undefined;
    const known = [
      "saveFailed",
      "uploadTimeout",
      "uploadUnexpected",
      "uploadInterrupted",
    ] as const;
    if ((known as readonly string[]).includes(msg)) {
      return t(msg as (typeof known)[number]);
    }
    return msg;
  }

  function translateWizardErrorMsg(msg: string | null | undefined): string | null {
    if (!msg) return null;
    if (msg === "photoMinOne" || msg === "photoMinForReview") {
      return tErrors(msg, { count: MIN_LISTING_PHOTOS_FOR_REVIEW });
    }
    return msg;
  }

  const showGrid = savedImageCount > 0 || uploadQueue.length > 0 || images.length > 0;
  const showEmptyUpload =
    photosHydrated && !photosLoading && savedImageCount === 0 && images.length === 0;

  return (
    <div className="space-y-4">
      {!hideHeading && (
        <div>
          <h2
            ref={stepHeadingRef}
            tabIndex={-1}
            className="font-display text-xl font-semibold text-charcoal outline-none"
          >
            {isManager ? t("managerTitle") : t("title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {showLoadingShell
              ? t("preparing")
              : isManager
                ? t("managerSubtitle")
                : t("subtitle")}
          </p>
          {!isManager && !showLoadingShell && rooms.length > 0 && (
            <p className="mt-2 text-xs text-muted">{t("roomsHint")}</p>
          )}
          {!showLoadingShell && (
            <p className="mt-2 text-xs text-muted">{t("fileHint")}</p>
          )}
        </div>
      )}

      {showLoadingShell && (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-2 text-sm font-medium text-charcoal">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            {t("loading")}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-xl bg-sand/80 ring-1 ring-border/60"
              />
            ))}
          </div>
        </div>
      )}

      {!showLoadingShell && (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-sand/30 px-6 py-10 transition-colors",
          dragActive && "border-gold bg-sand/50",
          isProcessingQueue && "border-gold/40 bg-sand/50",
          !showEmptyUpload && showGrid && "py-6"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessingQueue ? (
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        ) : (
          <Upload className="h-8 w-8 text-gold" />
        )}
        <p className="mt-3 text-sm font-medium text-charcoal">
          {isProcessingQueue
            ? t("uploadingBatch")
            : showEmptyUpload
              ? t("addPhotos")
              : t("addMore")}
        </p>
        <div className="mt-4 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={pending || isProcessingQueue}
            onClick={() => libraryInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-sand disabled:opacity-50"
          >
            <Images className="h-4 w-4 text-gold" />
            {t("fromLibrary")}
          </button>
          <button
            type="button"
            disabled={pending || isProcessingQueue}
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-sand disabled:opacity-50"
          >
            <Camera className="h-4 w-4 text-gold" />
            {t("takePhoto")}
          </button>
        </div>
        <span className="mt-3 text-xs text-muted">{t("orDrag")}</span>
        <input
          ref={libraryInputRef}
          type="file"
          accept={`${ACCEPTED_LISTING_PHOTO_ACCEPT},image/*`}
          multiple
          className="sr-only"
          onChange={handleFileInputChange}
          disabled={pending || isProcessingQueue}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileInputChange}
          disabled={pending || isProcessingQueue}
        />
      </div>
      )}

      {isManager && showGrid && !showLoadingShell && (
        <p className="rounded-xl border border-border bg-sand/30 px-3 py-2 text-xs text-muted">
          {t("managerSubtitle")}
        </p>
      )}

      {(uploadStats.total > 0 || isProcessingQueue) && (
        <div className="rounded-xl border border-border bg-white px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>
              {t("uploadProgress", {
                uploaded: uploadStats.uploaded,
                total: uploadStats.total,
              })}
            </span>
            {activeUploads > 0 && (
              <span>{t("uploadsInProgress", { count: activeUploads })}</span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-gold transition-all duration-300"
              style={{
                width: `${
                  uploadStats.total > 0
                    ? (uploadStats.uploaded / uploadStats.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {failedCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">
            {t("failedCount", { count: failedCount })}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-red-700/90">
            {t("failedHint")}
          </p>
          <button
            type="button"
            onClick={handleRetryFailed}
            disabled={isProcessingQueue}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            {t("retryAllFailed")}
          </button>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gold/25 bg-gold/5 px-3 py-2">
          <span className="text-sm font-medium text-charcoal">
            {t("selectedCount", { count: selectedIds.size })}
          </span>
          {rooms.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                handleBulkAssignRoom(e.target.value);
                e.target.value = "";
              }}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
            >
              <option value="" disabled>
                {t("assignRoom")}
              </option>
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
            onClick={handleBulkDelete}
            disabled={pending || isProcessingQueue}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {t("delete")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-muted hover:text-charcoal"
          >
            {t("cancelSelection")}
          </button>
        </div>
      )}

      {showGrid && (
        <div className="space-y-3">
          {orderSaveStatus === "saved" && (
            <p className="text-xs font-medium text-teal">{t("saved")}</p>
          )}
          {orderSaveStatus === "saving" && (
            <p className="text-xs text-muted">{t("savingOrder")}</p>
          )}
          {orderSaveStatus === "error" && (
            <p className="text-xs text-red-600">{t("orderSaveError")}</p>
          )}
          <SortableListingPhotoGrid
            images={images}
            isManager={isManager}
            rooms={rooms}
            selectedIds={selectedIds}
            pending={pending}
            isProcessingQueue={isProcessingQueue}
            onLiveReorder={handleLiveReorder}
            onPersistOrder={handlePersistOrder}
            onToggleSelected={toggleSelected}
            onSetCover={handleSetCover}
            onMoveToStart={handleMoveToStart}
            onCaption={handleCaption}
            onAssignRoom={handleAssignRoom}
            onDelete={handleDelete}
          />
          {uploadQueue.filter((item) => item.status !== "uploaded").length > 0 && (
            <div
              className={cn(
                "grid gap-4",
                isManager ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {uploadQueue
                .filter((item) => item.status !== "uploaded")
                .map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "relative overflow-hidden rounded-xl border bg-white",
                      item.status === "failed" ? "border-red-300" : "border-border",
                      item.status === "uploading" && "ring-2 ring-gold/40"
                    )}
                  >
                    <div className="relative aspect-[4/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className={cn(
                          "h-full w-full object-cover",
                          item.status === "waiting" && "opacity-70",
                          item.status === "failed" && "opacity-50"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => handleDismissQueueItem(item)}
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-charcoal/80 text-white shadow hover:bg-charcoal"
                        aria-label={t("removeNamed", { name: item.name })}
                        title={t("remove")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {(item.status === "waiting" || item.status === "uploading") && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal/45 px-3 text-center">
                          {item.status === "uploading" ? (
                            <Loader2 className="h-7 w-7 animate-spin text-white" />
                          ) : (
                            <span className="text-xs font-medium text-white/90">
                              {statusLabel.waiting}
                            </span>
                          )}
                        </div>
                      )}
                      {item.status === "failed" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/25">
                          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            {statusLabel.failed}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 border-t border-border px-2 py-2">
                      <p
                        className="truncate text-[11px] font-medium text-charcoal"
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      {item.status === "failed" ? (
                        <p className="text-[11px] leading-snug text-red-600">
                          {translatePhotoItemError(item.error) ?? t("saveFailed")}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted">{statusLabel[item.status]}</p>
                      )}
                      {item.status === "failed" && !item.id.startsWith("reject-") && (
                        <button
                          type="button"
                          onClick={() => handleRetryItem(item)}
                          disabled={isProcessingQueue}
                          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {t("retry")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <p
        className={cn(
          "text-sm",
          savedImageCount >= MIN_LISTING_PHOTOS_FOR_REVIEW
            ? "text-teal"
            : savedImageCount >= MIN_LISTING_PHOTOS_REQUIRED
              ? "text-charcoal"
              : "text-amber-700"
        )}
      >
        {isProcessingQueue
          ? t("dontClose")
          : t(photoStatus.key, photoStatus.params ?? {})}
      </p>

      {validationErrors.map((msg) => (
        <p key={msg} className="text-sm text-red-500">
          {msg}
        </p>
      ))}

      {error && (
        <p className="text-sm text-red-500">{translateWizardErrorMsg(error)}</p>
      )}
    </div>
  );
}
