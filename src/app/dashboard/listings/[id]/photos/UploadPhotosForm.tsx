"use client";



import { useActionState, useState } from "react";

import Link from "next/link";

import { Upload, ArrowLeft, Video } from "lucide-react";

import { AccountShell } from "@/components/account/AccountShell";

import { GlassCard } from "@/components/ui/GlassCard";

import { DeletePhotoButton } from "@/components/dashboard/DeletePhotoButton";

import {

  MAX_LISTING_PHOTOS,

  MAX_LISTING_VIDEOS,

  MAX_VIDEO_DURATION_SECONDS,

} from "@/lib/constants";

import { uploadListingPhotos } from "@/lib/actions";

import type { ListingImage, Profile } from "@/lib/types";



type UploadPhotosFormProps = {

  listingId: string;

  existingImages: ListingImage[];

  isFree: boolean;

  profile: Profile;

  email: string;

};



export function UploadPhotosForm({

  listingId,

  existingImages,

  isFree,

  profile,

  email,

}: UploadPhotosFormProps) {

  const [previews, setPreviews] = useState<string[]>([]);

  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const [videoError, setVideoError] = useState<string | null>(null);



  const existingVideos = existingImages.filter((i) => i.media_type === "video").length;

  const existingPhotos = existingImages.filter((i) => i.media_type !== "video").length;

  const totalCount = existingImages.length + previews.length + (videoPreview ? 1 : 0);

  const canContinue = existingImages.length > 0 || previews.length > 0 || videoPreview;

  const continueLabel = isFree ? "Συνέχεια → Υποβολή" : "Συνέχεια → Πληρωμή";



  const [state, formAction, pending] = useActionState(

    async (_prev: { error?: string } | null, formData: FormData) => {

      if (videoDuration) {

        formData.set("video_duration", String(videoDuration));

      }

      return (await uploadListingPhotos(listingId, formData)) ?? null;

    },

    null

  );



  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {

    const remaining = MAX_LISTING_PHOTOS - existingImages.length;

    const files = Array.from(e.target.files ?? []).slice(0, remaining);

    setPreviews(files.map((f) => URL.createObjectURL(f)));

  }



  function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {

    setVideoError(null);

    const file = e.target.files?.[0];

    if (!file) return;



    if (!file.type.startsWith("video/")) {

      setVideoError("Επίλεξε έγκυρο αρχείο βίντεο");

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

        setVideoError(`Μέγιστο ${MAX_VIDEO_DURATION_SECONDS} δευτερόλεπτα`);

        setVideoPreview(null);

        setVideoDuration(null);

        return;

      }

      setVideoDuration(duration);

      setVideoPreview(URL.createObjectURL(file));

    };

  }



  return (

    <AccountShell

      profile={profile}

      email={email}

      active="listings"

      title="Φωτογραφίες & βίντεο"

      subtitle={`${existingPhotos} φωτογραφίες · ${existingVideos} βίντεο · έως ${MAX_LISTING_PHOTOS} αρχεία · βίντεο έως ${MAX_VIDEO_DURATION_SECONDS} δευτ.`}

    >

      <Link

        href="/dashboard/listings"

        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-gold"

      >

        <ArrowLeft className="h-4 w-4" />

        Πίσω στις αγγελίες

      </Link>



      <GlassCard className="p-8">

            {existingImages.length > 0 && (

              <div className="mb-6">

                <p className="mb-3 text-xs text-muted uppercase">Υπάρχοντα αρχεία</p>

                <div className="grid grid-cols-4 gap-2">

                  {existingImages.map((img) => (

                    <div key={img.id} className="relative aspect-square">

                      {img.media_type === "video" ? (

                        <video src={img.url} className="h-full w-full rounded-lg object-cover" muted />

                      ) : (

                        // eslint-disable-next-line @next/next/no-img-element

                        <img src={img.url} alt="" className="h-full w-full rounded-lg object-cover" />

                      )}

                      <DeletePhotoButton listingId={listingId} imageId={img.id} />

                    </div>

                  ))}

                </div>

              </div>

            )}



            <form action={formAction} className="space-y-6">

              {existingImages.length < MAX_LISTING_PHOTOS && (

                <label className="flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-sand/30 p-12 transition-colors hover:border-gold/40">

                  <Upload className="h-10 w-10 text-gold/60" />

                  <span className="text-sm text-muted">

                    Φωτογραφίες · απομένουν {MAX_LISTING_PHOTOS - existingImages.length}

                  </span>

                  <input

                    type="file"

                    name="photos"

                    accept="image/*"

                    multiple

                    onChange={handlePhotos}

                    className="hidden"

                  />

                </label>

              )}



              {existingVideos < MAX_LISTING_VIDEOS && existingImages.length < MAX_LISTING_PHOTOS && (

                <label className="flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-teal/20 bg-teal/[0.03] p-8 transition-colors hover:border-teal/40">

                  <Video className="h-8 w-8 text-teal/70" />

                  <span className="text-sm text-muted">

                    Βίντεο (max {MAX_VIDEO_DURATION_SECONDS} δευ.) · 1 ανά αγγελία

                  </span>

                  <input

                    type="file"

                    name="video"

                    accept="video/*"

                    onChange={handleVideo}

                    className="hidden"

                  />

                </label>

              )}



              {videoError && <p className="text-sm text-red-400">{videoError}</p>}



              {previews.length > 0 && (

                <div className="grid grid-cols-4 gap-2">

                  {previews.map((src, i) => (

                    // eslint-disable-next-line @next/next/no-img-element

                    <img key={i} src={src} alt="" className="aspect-square rounded-lg object-cover" />

                  ))}

                </div>

              )}



              {videoPreview && (

                <video src={videoPreview} controls className="w-full rounded-xl" />

              )}



              {(state?.error || videoError) && (

                <p className="text-sm text-red-400">{state?.error ?? videoError}</p>

              )}



              <button

                type="submit"

                disabled={pending || !canContinue}

                className="w-full rounded-full bg-gradient-to-r from-gold to-gold-light py-4 font-semibold text-white disabled:opacity-50"

              >

                {pending ? "Ανέβασμα..." : continueLabel}

              </button>



              {totalCount > MAX_LISTING_PHOTOS && (

                <p className="text-sm text-red-400">

                  Μέγιστο {MAX_LISTING_PHOTOS} αρχεία συνολικά

                </p>

              )}

            </form>

          </GlassCard>

    </AccountShell>

  );

}


