"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteListingPhoto } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function DeletePhotoButton({
  listingId,
  imageId,
}: {
  listingId: string;
  imageId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Να διαγραφεί η φωτογραφία;")) return;
    startTransition(async () => {
      const result = await deleteListingPhoto(listingId, imageId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500 disabled:opacity-50"
      aria-label="Διαγραφή φωτογραφίας"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
