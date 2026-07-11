import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { AccountNavId } from "@/components/account/account-nav";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  email: string;
  active: AccountNavId;
  title: string;
  subtitle?: string;
  variant?: "default" | "workspace";
  children: React.ReactNode;
};

/** @deprecated props profile/email kept for call-site compatibility; layout provides context */
export function AccountShell({
  active,
  title,
  subtitle,
  variant = "default",
  children,
}: Props) {
  return (
    <DashboardShell active={active} title={title} subtitle={subtitle} variant={variant}>
      {children}
    </DashboardShell>
  );
}
