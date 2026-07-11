import { redirect } from "next/navigation";

export default function LegacyProfileSettingsRedirect() {
  redirect("/dashboard/profile");
}
