/** Enable with NEXT_PUBLIC_REQUIRE_PHONE_SMS=true when Twilio SMS is live in production. */
export const REQUIRE_LISTING_PHONE_SMS_VERIFICATION =
  process.env.NEXT_PUBLIC_REQUIRE_PHONE_SMS === "true";

export const MAX_LISTING_PHOTOS = 30;
export const MAX_PHOTOS_PER_BATCH = 30;
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
export const PHOTO_UPLOAD_CONCURRENCY = 3;
export const MIN_LISTING_PHOTOS_REQUIRED = 1;
export const MIN_LISTING_PHOTOS_FOR_REVIEW = 5;
export const MAX_LISTING_VIDEOS = 1;
export const MAX_VIDEO_DURATION_SECONDS = 75;
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
