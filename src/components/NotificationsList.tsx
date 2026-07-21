"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { Notification } from "@/types/database";

interface NotificationsListProps {
  backHref: string;
  themeGradient?: string;
}

export function NotificationsList({ backHref, themeGradient = "from-primary-600 to-emerald-600" }: NotificationsListProps) {
  const router = useRouter();
  const supabase = createClient();
  const { subscribe } = usePushNotifications();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  async function handleEnablePush() {
    setEnablingPush(true);
    const result = await subscribe();
    setEnablingPush(false);
    if (result.success) {
      setPushEnabled(true);
      toast.success("Push Notification सुरू झाले");
    } else {
      toast.error(result.reason || "सुरू करता आले नाही");
    }
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .or(`recipient_id.eq.${user.id},target_type.eq.all`)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setLoading(false);

      await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user.id).eq("is_read", false);
    }
    load();

    const channel = supabase
      .channel("notifications-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "आत्ताच";
    if (mins < 60) return `${mins} मिनिटांपूर्वी`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} तासांपूर्वी`;
    return `${Math.floor(hours / 24)} दिवसांपूर्वी`;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className={`bg-gradient-to-br ${themeGradient} px-5 pb-6 pt-6`}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(backHref)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">सूचना</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        {!pushEnabled && (
          <button
            onClick={handleEnablePush}
            disabled={enablingPush}
            className="glass-card mb-4 flex w-full items-center gap-3 p-4 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              {enablingPush ? <Loader2 className="h-4 w-4 animate-spin text-amber-600" /> : <BellRing className="h-4 w-4 text-amber-600" />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Push Notification सुरू करा</p>
              <p className="text-xs text-gray-500">App बंद असतानाही सूचना मिळतील</p>
            </div>
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : notifications.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Bell className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">कोणतीही सूचना नाही</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((n) => (
              <div key={n.id} className="glass-card p-4">
                <p className="text-sm font-bold text-gray-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>
                <p className="mt-1.5 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
