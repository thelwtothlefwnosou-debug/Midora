import { getSupabaseEnv } from "./db-env";

async function main() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const res = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/listings?select=id,title,slug,status,rental_type,price_per_night,price_monthly,area,city&status=eq.approved&is_hidden=eq.false&order=created_at.desc&limit=10`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const data = await res.json();
  if (!res.ok) {
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main();
