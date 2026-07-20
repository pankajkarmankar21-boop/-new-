"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ChatWindow } from "@/components/ChatWindow";

export default function DriverChatPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [farmerName, setFarmerName] = useState("शेतकरी");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("bookings")
        .select("farmers(full_name)")
        .eq("id", bookingId)
        .single();
      if ((data as any)?.farmers?.full_name) setFarmerName((data as any).farmers.full_name);
      setLoading(false);
    }
    load();
  }, [bookingId, supabase]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-earth-600" />
      </main>
    );
  }

  return (
    <ChatWindow
      bookingId={bookingId}
      otherPartyName={farmerName}
      otherPartyRole="शेतकरी"
      backHref={`/driver/jobs/${bookingId}`}
      themeGradient="from-earth-600 to-amber-600"
    />
  );
}
