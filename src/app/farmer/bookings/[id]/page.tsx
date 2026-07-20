"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MessageCircle, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateMarathi } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "प्रतीक्षेत", accepted: "स्वीकारले", rejected: "नाकारले", started: "निघाले",
  reached: "पोहोचले", in_progress: "काम सुरू", completed: "काम पूर्ण", cancelled: "रद्द",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", accepted: "bg-sky-100 text-sky-700", started: "bg-sky-100 text-sky-700",
  reached: "bg-indigo-100 text-indigo-700", in_progress: "bg-primary-100 text-primary-700",
  completed: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-600",
};

export default function FarmerBookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("bookings")
        .select("*, drivers(full_name, mobile_number, rating)")
        .eq("id", bookingId)
        .single();
      setBooking(data);

      const { data: itemsData } = await supabase
        .from("booking_items")
        .select("*, farms(village, survey_number), services(name)")
        .eq("booking_id", bookingId);
      setItems(itemsData || []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${bookingId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  if (loading || !booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </main>
    );
  }

  const driver = booking.drivers;
  const showOtp = booking.completion_otp && !booking.completion_otp_verified && booking.status === "in_progress";

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/farmer/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{booking.booking_number}</h1>
            <p className="text-xs text-gray-500">{formatDateMarathi(booking.booking_date)}</p>
          </div>
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[booking.status]}`}>
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        {/* Completion OTP — very prominent, this is what the farmer reads out to the driver */}
        {showOtp && (
          <div className="glass-card mb-5 overflow-hidden">
            <div className="bg-gradient-to-br from-primary-600 to-emerald-600 p-5 text-center">
              <div className="mb-2 flex items-center justify-center gap-1.5 text-white/90">
                <KeyRound className="h-4 w-4" />
                <span className="text-sm font-semibold">काम पूर्ण झाल्यावर हा OTP ड्रायव्हरला सांगा</span>
              </div>
              <p className="text-4xl font-extrabold tracking-[0.3em] text-white">{booking.completion_otp}</p>
            </div>
          </div>
        )}

        {booking.completion_otp_verified && (
          <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-4 text-emerald-700">
            <ShieldCheck className="h-5 w-5" /> <span className="font-bold">काम पडताळणी सह पूर्ण झाले</span>
          </div>
        )}

        {/* Driver info */}
        {driver && (
          <div className="glass-card mb-5 p-5">
            <h2 className="mb-3 text-sm font-bold text-gray-700">नियुक्त ड्रायव्हर</h2>
            <p className="text-base font-bold text-gray-900">{driver.full_name}</p>
            <p className="mb-3 text-sm text-gray-500">रेटिंग: {driver.rating} ⭐</p>
            <div className="flex gap-3">
              <a href={`tel:${driver.mobile_number}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary-600 py-2.5 text-sm font-bold text-white">
                <Phone className="h-4 w-4" /> कॉल करा
              </a>
              <Link href={`/farmer/bookings/${bookingId}/chat`} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-primary-600 py-2.5 text-sm font-bold text-primary-700">
                <MessageCircle className="h-4 w-4" /> Chat
              </Link>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="glass-card mb-5 p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-700">सेवा तपशील</h2>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                <span>{item.services?.name} · {item.farms?.village}</span>
                <span className="font-semibold">{formatCurrency(item.final_amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-bold text-gray-700">एकूण</span>
            <span className="text-lg font-extrabold text-primary-700">{formatCurrency(booking.final_amount)}</span>
          </div>
        </div>

        {booking.notes && (
          <div className="glass-card mb-5 p-5">
            <h2 className="mb-2 text-sm font-bold text-gray-700">टिपा</h2>
            <p className="text-sm text-gray-600">{booking.notes}</p>
          </div>
        )}

        {booking.payment_status === "success" && (
          <Link href="/farmer/invoices" className="btn-secondary w-full">पावती पहा</Link>
        )}
      </div>
    </main>
  );
}
