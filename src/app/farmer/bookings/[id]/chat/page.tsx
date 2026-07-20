"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ChatWindow } from "@/components/ChatWindow";

export default function FarmerChatPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("ड्रायव्हर");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("bookings")
        .select("drivers(full_name)")
        .eq("id", bookingId)
        .single();
      if ((data as any)?.drivers?.full_name) setDriverName((data as any).drivers.full_name);
      setLoading(false);
    }
    load();
  }, [bookingId, supabase]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </main>
    );
  }

  return (
    <ChatWindow
      bookingId={bookingId}
      otherPartyName={driverName}
      otherPartyRole="ड्रायव्हर"
      backHref={`/farmer/bookings/${bookingId}`}
      themeGradient="from-primary-600 to-emerald-600"
    />
  );
}
