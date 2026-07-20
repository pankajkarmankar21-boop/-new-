import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient, createAdminClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || "support@kisan-jutai.app"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

/**
 * Sends a push notification to a specific user. Called server-side only
 * (e.g. from notify_nearby_drivers flow, or admin broadcast) — never
 * exposed for a farmer/driver to push-notify each other directly.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login आवश्यक आहे" }, { status: 401 });

  // Only admins (or the internal system, via service role callers) can trigger sends
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "अनधिकृत" }, { status: 403 });
  }

  const { userId, title, body, url } = await req.json();
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "अपुरी माहिती" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: subscriptions } = await admin.from("push_subscriptions").select("*").eq("user_id", userId);

  const results = await Promise.allSettled(
    (subscriptions || []).map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, data: { url: url || "/" } })
      )
    )
  );

  const failedEndpoints = (subscriptions || [])
    .filter((_: any, i: number) => results[i].status === "rejected")
    .map((s: any) => s.endpoint);

  // Clean up subscriptions that are no longer valid (e.g. user uninstalled the app)
  if (failedEndpoints.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", failedEndpoints);
  }

  return NextResponse.json({ sent: results.filter((r) => r.status === "fulfilled").length });
}
