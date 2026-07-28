"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { DeletePhotoButton } from "@/components/dashboard/DeletePhotoButton";
import {
  MAX_LISTING_PHOTOS,
  MAX_LISTING_VIDEOS,
  MAX_VIDEO_DURATION_SECONDS,
} from "@/lib/constants";
import { uploadListingVideo } from "@/lib/listing-photo-rooms";
import type { ListingImage } from "@/lib/types";

type Props = {
  listingId: string;
  existingImages: ListingImage[];
};

export function ListingVideoUploadCard({ listingId, existingImages }: Props) {
  const router = useRouter();
  const t = useTranslations("Workspace.videoUpload");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const existingVideos = existingImages.filter((i) => i.media_type === "video");
  const totalCount = existingImages.length;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!videoPreview) return;
    setSubmitError(null);

    const fd = new FormData(e.currentTarget);
    if (videoDuration) fd.set("video_duration", String(videoDuration));

    startTransition(async () => {
      const result = await uploadListingVideo(listingId, fd);
      if (result && "error" in result && result.error) {
        setSubmitError(result.error);
        return;
      }
      setVideoPreview(null);
      setVideoDuration(null);
      router.refresh();
    });
  }

  function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    setVideoError(null);
    setSubmitError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setVideoError(t("invalidFile"));
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = Math.ceil(video.duration);
      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        setVideoError(t("maxDuration", { seconds: MAX_VIDEO_DURATION_SECONDS }));
        setVideoPreview(null);
        setVideoDuration(null);
        return;
      }
      setVideoDuration(duration);
      setVideoPreview(URL.createObjectURL(file));
    };
  }

  if (existingVideos.length >= MAX_LISTING_VIDEOS && !videoPreview) {
    return (
      <GlassCard className="mt-6 p-6">
        <p className="text-sm font-medium text-charcoal">{t("listingVideo")}</p>
        <div className="relative mt-3 aspect-video max-w-md overflow-hidden rounded-xl">
          <video src={existingVideos[0].url} controls className="h-full w-full object-cover" />
          <DeletePhotoButton listingId={listingId} imageId={existingVideos[0].id} />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mt-6 p-6">
      <p className="font-display text-base font-semibold text-charcoal">{t("titleOptional")}</p>
      <p className="mt-1 text-sm text-muted">
        {t("hint", { seconds: MAX_VIDEO_DURATION_SECONDS })}
      </p>

      {existingVideos.length > 0 && (
        <div className="relative mt-4 aspect-video max-w-md overflow-hidden rounded-xl">
          <video src={existingVideos[0].url} controls className="h-full w-full object-cover" />
          <DeletePhotoButton listingId={listingId} imageId={existingVideos[0].id} />
        </div>
      )}

      {existingVideos.length < MAX_LISTING_VIDEOS && totalCount < MAX_LISTING_PHOTOS && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-teal/20 bg-teal/[0.03] p-8">
            <Video className="h-8 w-8 text-teal/70" />
            <span className="text-sm text-muted">{t("uploadVideo")}</span>
            <input type="file" name="video" accept="video/*" onChange={handleVideo} className="hidden" />
          </label>
          {videoPreview && <video src={videoPreview} controls className="w-full max-w-md rounded-xl" />}
          {(submitError || videoError) && (
            <p className="text-sm text-red-500">{submitError ?? videoError}</p>
          )}
          {videoPreview && (
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? t("uploading") : t("saveVideo")}
            </button>
          )}
        </form>
      )}
    </GlassCard>
  );
}
