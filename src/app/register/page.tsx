import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  q.set("mode", "register");
  if (params.redirect) q.set("redirect", params.redirect);
  if (params.next) q.set("redirect", params.next);
  if (params.ref) q.set("ref", params.ref);
  redirect(`/login?${q.toString()}`);
}
