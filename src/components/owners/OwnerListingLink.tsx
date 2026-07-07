import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  buildAuthRedirectUrl,
  OWNER_LISTING_NEW_PATH,
} from "@/lib/owner-flow";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export async function OwnerListingLink({
  children,
  variant = "primary",
  size = "md",
  className,
}: Props) {
  let href = buildAuthRedirectUrl(OWNER_LISTING_NEW_PATH, "register");

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) href = OWNER_LISTING_NEW_PATH;
    }
  }

  return (
    <Button href={href} variant={variant} size={size} className={className}>
      {children}
    </Button>
  );
}
