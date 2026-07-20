"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Layers, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateMarathi } from "@/lib/utils";
import { DriverBottomNav } from "@/components/DriverBottomNav";

interface RequestItem {
  bookingId: string;
  bookingNumber: string;
  bookingDate: string;
  finalAmount: number;
  notes: string | null;
  farmerVillage: string;
  items: { serviceName: string; farmVillage: string; areaAcre: number }[];
}

export default function DriverRequestsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approved, setApproved] = useState(true);

  async function loadRequests() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data: driverData } = await supabase.from("drivers").select("approval_status").eq("id", user.id).single();
    setApproved(driverData?.approval_status === "approved");

    const { data: logs } = await supabase
      .from("booking_notifications_log")
      .select("booking_id, responded")
      .eq("driver_id", user.id)
      .eq("responded", false);

    const bookingIds = (logs || []).map((l) => l.booking_id);
    if (bookingIds.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, booking_number, booking_date, final_amount, notes, status, farmers(village), booking_items(area_acre, farms(village), services(name))")
      .in("id", bookingIds)
      .eq("status", "pending")
      .eq("payment_status", "success")
      .order("created_at", { ascending: false });

    const mapped: RequestItem[] = (bookings || []).map((b: any) => ({
      bookingId: b.id,
      bookingNumber: b.booking_number,
      bookingDate: b.booking_date,
      finalAmount: b.final_amount,
      notes: b.notes,
      farmerVillage: b.farmers?.village || "",
      items: (b.booking_items || []).map((bi: any) => ({
        serviceName: bi.services?.name || "",
        farmVillage: bi.farms?.village || "",
        areaAcre: bi.area_acre,
      })),
    }));

    setRequests(mapped);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
    const channel = supabase
      .channel("driver-new-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "booking_notifications_log" }, () => {
        loadRequests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAccept(bookingId: string) {
    setProcessingId(bookingId);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data: current } = await supabase.from("bookings").select("status, assigned_driver_id").eq("id", bookingId).single();
    if (current?.status !== "pending" || current?.assigned_driver_id) {
      toast.error("हे बुकिंग दुसऱ्या ड्रायव्हरने आधीच स्वीकारले आहे");
      setProcessingId(null);
      loadRequests();
      return;
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status: "accepted", assigned_driver_id: user.id })
      .eq("id", bookingId)
      .eq("status", "pending");

    if (error) {
      toast.error("स्वीकारता आले नाही, पुन्हा प्रयत्न करा");
    } else {
      await supabase
        .from("booking_notifications_log")
        .update({ responded: true })
        .eq("booking_id", bookingId)
        .eq("driver_id", user.id);
      toast.success("बुकिंग स्वीकारले!");
      loadRequests();
    }
    setProcessingId(null);
  }

  async function handleReject() {
    if (!rejectingId) return;
    if (!rejectReason.trim()) {
      toast.error("नाकारण्याचे कारण लिहा");
      return;
    }
    setProcessingId(rejectingId);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    await supabase
      .from("booking_notifications_log")
      .update({ responded: true })
      .eq("booking_id", rejectingId)
      .eq("driver_id", user.id);

    await supabase.from("booking_status_history").insert({
      booking_id: rejectingId,
      status: "rejected",
      changed_by: user.id,
      reason: rejectReason,
    });

    toast.success("नाकारले");
    setRejectingId(null);
    setRejectReason("");
    setProcessingId(null);
    loadRequests();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-earth-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-earth-600 to-amber-600 px-5 pb-6 pt-6">
        <h1 className="text-xl font-bold text-white">नवीन विनंत्या</h1>
        <p className="text-sm text-white/80">तुमच्या गावाजवळील उपलब्ध कामे</p>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        {!approved && (
          <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            तुमची नोंदणी अजून मंजूर झालेली नाही. मंजुरीनंतर तुम्हाला बुकिंग दिसतील.
          </div>
        )}

        {requests.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Layers className="h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">सध्या कोणतीही नवीन विनंती नाही</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map((r) => (
              <motion.div key={r.bookingId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">{r.bookingNumber}</span>
                  <span className="text-xs font-semibold text-gray-500">{formatDateMarathi(r.bookingDate)}</span>
                </div>

                <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <MapPin className="h-4 w-4 text-earth-600" /> {r.farmerVillage}
                </div>

                <div className="mb-3 flex flex-col gap-1.5">
                  {r.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                      <span className="text-gray-700">{item.serviceName} · {item.farmVillage}</span>
                      <span className="font-semibold text-gray-900">{item.areaAcre} एकर</span>
                    </div>
                  ))}
                </div>

                {r.notes && <p className="mb-3 text-sm italic text-gray-500">"{r.notes}"</p>}

                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">एकूण कमाई</span>
                  <span className="text-lg font-extrabold text-earth-700">{formatCurrency(r.finalAmount)}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setRejectingId(r.bookingId)}
                    disabled={processingId === r.bookingId}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600"
                  >
                    <X className="h-4 w-4" /> नाकारा
                  </button>
                  <button
                    onClick={() => handleAccept(r.bookingId)}
                    disabled={processingId === r.bookingId}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-hero py-3 text-sm font-bold text-white shadow-glow-primary"
                  >
                    {processingId === r.bookingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> स्वीकारा</>}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {rejectingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end bg-black/50">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full rounded-t-3xl bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-gray-900">नाकारण्याचे कारण</h3>
              <p className="mb-4 text-sm text-gray-500">कृपया कारण लिहा (आवश्यक)</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="input-field mb-4"
                placeholder="उदा. आधीच दुसरे काम आहे"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="btn-secondary flex-1">रद्द करा</button>
                <button onClick={handleReject} className="flex-1 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white">नाकारा</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DriverBottomNav active="requests" />
    </main>
  );
}
