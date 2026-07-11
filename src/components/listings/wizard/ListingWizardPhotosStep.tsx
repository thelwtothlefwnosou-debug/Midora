"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import Image from "next/image";
import {
  Camera,
  GripVertical,
  Images,
  Loader2,
  RefreshCw,
  Star,
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
import { isCoverPhoto, roomBadgeLabel } from "@/lib/listing-photo-display";
import { type PhotoRoomDef } from "@/lib/photo-rooms-catalog";
import { MIN_LISTING_PHOTOS_FOR_REVIEW, MIN_LISTING_PHOTOS_REQUIRED, PHOTO_UPLOAD_CONCURRENCY } from "@/lib/constants";
import {
  logListingImageValidationDebug,
  photoCountStatusMessage,
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
  onPhotoCountChange?: () => void;
  onUploadBusyChange?: (busy: boolean) => void;
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
const STATUS_LABEL: Record<QueueStatus, string> = {
  waiting: "Σε αναμονή",
  uploading: "Ανέβασμα",
  uploaded: "Προστέθηκε",
  failed: "Απέτυχε",
};

export function ListingWizardPhotosStep({
  listingId,
  initialImages,
  onPhotoCountChange,
  onUploadBusyChange,
  stepHeadingRef,
  variant = "wizard",
  rooms = [],
  hideHeading = false,
}: Props) {
  const isManager = variant === "manager";
  const [images, setImages] = useState(sortPhotos(initialImages));
  const [savedImageCount, setSavedImageCount] = useState(0);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [dragReorderIndex, setDragReorderIndex] = useState<number | null>(null);
  const [uploadStats, setUploadStats] = useState({ uploaded: 0, total: 0 });
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [pending, startTransition] = useTransition();

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

  const refreshImages = useCallback(async () => {
    const [imagesResult, countResult] = await Promise.all([
      getOwnerListingImages(listingId),
      getSavedListingImageCount(listingId),
    ]);

    const savedCount =
      "photoCount" in countResult && typeof countResult.photoCount === "number"
        ? countResult.photoCount
        : 0;
    setSavedImageCount(savedCount);

    let photos: ListingImage[] = [];
    if ("images" in imagesResult && imagesResult.images) {
      photos = sortPhotos(imagesResult.images);
      setImages(photos);
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

    onPhotoCountChange?.();
    return photos;
  }, [listingId, onPhotoCountChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load saved listing images from database
    void refreshImages();
  }, [listingId, refreshImages]);

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
            error:
              result.error ??
              "Δεν ήταν δυνατή η αποθήκευση της φωτογραφίας στην αγγελία. Δοκίμασε ξανά.",
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
          error: timedOut
            ? "Το ανέβασμα διήρκεσε πολύ. Δοκίμασε ξανά ή διάλεξε μικρότερο αρχείο."
            : "Απροσδόκητο σφάλμα κατά το ανέβασμα. Δοκίμασε ξανά.",
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
                  error:
                    "Το ανέβασμα διακόπηκε. Πάτησε «Επανάληψη» για να ξαναδοκιμάσεις.",
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

      const { valid, rejected, globalErrors } = partitionListingPhotoFiles(files);
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
      const confirmed = window.confirm("Θέλεις να διαγράψεις αυτή τη φωτογραφία;");
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
      `Θέλεις να διαγράψεις ${selectedIds.size} επιλεγμένες φωτογραφίες;`
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
    const next = window.prompt("Λεζάντα φωτογραφίας (προαιρετικά):", current ?? "");
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
    persistOrder(next);
  }

  function persistOrder(next: ListingImage[]) {
    setImages(next);
    void reorderListingPhotos(
      listingId,
      next.map((i) => i.id)
    ).then(() => refreshImages());
  }

  function handleReorderDrop(targetIndex: number) {
    if (dragReorderIndex === null || dragReorderIndex === targetIndex) return;
    const next = [...images];
    const [item] = next.splice(dragReorderIndex, 1);
    next.splice(targetIndex, 0, item);
    setDragReorderIndex(null);
    persistOrder(next);
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
  const showGrid = savedImageCount > 0 || uploadQueue.length > 0 || images.length > 0;

  return (
    <div className="space-y-4">
      {!hideHeading && (
        <div>
          <h2
            ref={stepHeadingRef}
            tabIndex={-1}
            className="font-display text-xl font-semibold text-charcoal outline-none"
          >
            {isManager ? "Φωτογραφίες" : "Φωτογραφίες ακινήτου"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {isManager
              ? "Ανέβασε, ταξινόμησε και όρισε εξώφυλλο. Η σειρά εδώ καθορίζει πώς θα εμφανίζονται οι φωτογραφίες στη δημόσια αγγελία."
              : "Ως ιδιοκτήτης, πρόσθεσε τουλάχιστον μία καθαρή φωτογραφία του ακινήτου. Η πρώτη επιτυχημένη φωτογραφία γίνεται κύρια· μπορείς να αλλάξεις κύρια ή σειρά ανά πάσα στιγμή."}
          </p>
          <p className="mt-2 text-xs text-muted">
            Επίλεξε από τη βιβλιοθήκη ή σύρε έως 30 αρχεία (JPG, PNG, WebP — έως 10 MB).
          </p>
        </div>
      )}

      {isManager && showGrid && (
        <p className="rounded-xl border border-border bg-sand/30 px-3 py-2 text-xs text-muted">
          Η σειρά εδώ καθορίζει πώς θα εμφανίζονται οι φωτογραφίες στη δημόσια αγγελία.
        </p>
      )}

      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-sand/30 px-6 py-10 transition-colors",
          dragActive && "border-gold bg-sand/50",
          isProcessingQueue && "border-gold/40 bg-sand/50"
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
          {isProcessingQueue ? "Ανέβασμα φωτογραφιών…" : "Πρόσθεσε φωτογραφίες"}
        </p>
        <div className="mt-4 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={pending || isProcessingQueue}
            onClick={() => libraryInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-sand disabled:opacity-50"
          >
            <Images className="h-4 w-4 text-gold" />
            Από βιβλιοθήκη
          </button>
          <button
            type="button"
            disabled={pending || isProcessingQueue}
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-sand disabled:opacity-50"
          >
            <Camera className="h-4 w-4 text-gold" />
            Λήψη με κάμερα
          </button>
        </div>
        <span className="mt-3 text-xs text-muted">ή σύρε φωτογραφίες εδώ</span>
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

      {(uploadStats.total > 0 || isProcessingQueue) && (
        <div className="rounded-xl border border-border bg-white px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>
              Ανέβηκαν {uploadStats.uploaded} από {uploadStats.total} φωτογραφίες
            </span>
            {activeUploads > 0 && (
              <span>{activeUploads} σε εξέλιξη</span>
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
            {failedCount === 1
              ? "1 φωτογραφία δεν ανέβηκε"
              : `${failedCount} φωτογραφίες δεν ανέβηκαν`}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-red-700/90">
            Δες τον λόγο κάτω από κάθε εικόνα, διόρθωσε το αρχείο (μορφή JPG/PNG/WEBP/HEIC,
            έως 10 MB) ή πάτησε <span className="font-semibold">×</span> για να την αφαιρέσεις.
          </p>
          <button
            type="button"
            onClick={handleRetryFailed}
            disabled={isProcessingQueue}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Επανάληψη όλων των αποτυχημένων
          </button>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gold/25 bg-gold/5 px-3 py-2">
          <span className="text-sm font-medium text-charcoal">
            {selectedIds.size} επιλεγμένες
          </span>
          {isManager && rooms.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                handleBulkAssignRoom(e.target.value);
                e.target.value = "";
              }}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
            >
              <option value="" disabled>
                Ανάθεση σε χώρο
              </option>
              <option value="">Χωρίς χώρο</option>
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
            Διαγραφή
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-muted hover:text-charcoal"
          >
            Ακύρωση επιλογής
          </button>
        </div>
      )}

      {showGrid && (
        <div className={cn("grid gap-3", isManager ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
          {images.map((img, index) => {
            const cover = isCoverPhoto(img, index);
            const roomLabel = roomBadgeLabel(img.room_key);
            return (
              <div
                key={img.id}
                draggable
                onDragStart={() => setDragReorderIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleReorderDrop(index);
                }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border bg-white shadow-soft",
                  dragReorderIndex === index && "ring-2 ring-gold/50"
                )}
              >
                <div className="relative aspect-[5/4]">
                  <Image
                    src={img.url}
                    alt={img.caption ?? img.file_name ?? "Φωτογραφία αγγελίας"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, 240px"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-charcoal/0 transition-colors group-hover:bg-charcoal/10" />
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-charcoal">
                    #{index + 1}
                  </span>
                  {cover && (
                    <span className="absolute left-2 top-9 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-white">
                      {isManager ? "Εξώφυλλο" : "Κύρια"}
                    </span>
                  )}
                  {roomLabel && (
                    <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-full bg-charcoal/80 px-2 py-0.5 text-[10px] font-medium text-white">
                      {roomLabel}
                    </span>
                  )}
                  <label className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-white/90 shadow">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-gold"
                      checked={selectedIds.has(img.id)}
                      onChange={() => toggleSelected(img.id)}
                    />
                  </label>
                </div>
                {img.caption && (
                  <p className="truncate border-t border-border px-3 py-1.5 text-xs text-muted">
                    {img.caption}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-2 py-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                  <div className="flex items-center gap-1 text-muted">
                    <GripVertical className="h-4 w-4" aria-hidden />
                    <span className="text-[11px]">Σύρε</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {!cover && (
                      <button
                        type="button"
                        disabled={pending || isProcessingQueue}
                        onClick={() => handleSetCover(img.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-charcoal hover:bg-sand disabled:opacity-40"
                      >
                        <Star className="h-3.5 w-3.5" />
                        {isManager ? "Εξώφυλλο" : "Κύρια"}
                      </button>
                    )}
                    {isManager && index > 0 && (
                      <button
                        type="button"
                        disabled={pending || isProcessingQueue}
                        onClick={() => handleMoveToStart(img.id)}
                        className="rounded px-2 py-1 text-[11px] text-charcoal hover:bg-sand disabled:opacity-40"
                      >
                        Αρχή
                      </button>
                    )}
                    {isManager && (
                      <>
                        <button
                          type="button"
                          disabled={pending || isProcessingQueue}
                          onClick={() => handleCaption(img.id, img.caption)}
                          className="rounded px-2 py-1 text-[11px] text-charcoal hover:bg-sand disabled:opacity-40"
                        >
                          Λεζάντα
                        </button>
                        {rooms.length > 0 && (
                          <select
                            value={img.room_key ?? ""}
                            onChange={(e) => handleAssignRoom(img.id, e.target.value)}
                            className="max-w-[7rem] rounded border border-border px-1 py-0.5 text-[10px]"
                          >
                            <option value="">Χωρίς χώρο</option>
                            {rooms.map((r) => (
                              <option key={r.key} value={r.key}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      disabled={pending || isProcessingQueue}
                      onClick={() => handleDelete(img.id)}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Διαγραφή
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

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
                    aria-label={`Αφαίρεση ${item.name}`}
                    title="Αφαίρεση"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {(item.status === "waiting" || item.status === "uploading") && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal/45 px-3 text-center">
                      {item.status === "uploading" ? (
                        <Loader2 className="h-7 w-7 animate-spin text-white" />
                      ) : (
                        <span className="text-xs font-medium text-white/90">
                          {STATUS_LABEL.waiting}
                        </span>
                      )}
                    </div>
                  )}
                  {item.status === "failed" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/25">
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        {STATUS_LABEL.failed}
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
                      {item.error ??
                        "Δεν ήταν δυνατή η αποθήκευση της φωτογραφίας στην αγγελία. Δοκίμασε ξανά."}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted">{STATUS_LABEL[item.status]}</p>
                  )}
                  {item.status === "failed" && !item.id.startsWith("reject-") && (
                    <button
                      type="button"
                      onClick={() => handleRetryItem(item)}
                      disabled={isProcessingQueue}
                      className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Επανάληψη
                    </button>
                  )}
                </div>
              </div>
            ))}
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
          ? "Μην κλείσεις τη σελίδα μέχρι να ολοκληρωθεί το ανέβασμα."
          : photoCountStatusMessage(savedImageCount)}
      </p>

      {validationErrors.map((msg) => (
        <p key={msg} className="text-sm text-red-500">
          {msg}
        </p>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
