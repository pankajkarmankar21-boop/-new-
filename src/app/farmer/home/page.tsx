"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell, User, History, FileText, Sparkles, Tractor,
  ChevronRight, Phone, MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { Booking, Service } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  pending: "प्रतीक्षेत",
  accepted: "स्वीकारले",
  rejected: "नाकारले",
  started: "निघाले",
  reached: "पोहोचले",
  in_progress: "काम सुरू",
  completed: "काम पूर्ण",
  cancelled: "रद्द",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-sky-100 text-sky-700",
  started: "bg-sky-100 text-sky-700",
  reached: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-primary-100 text-primary-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function FarmerHomePage() {
  const supabase = createClient();
  const [farmerName, setFarmerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentBooking, setCurrentBooking] = useState<(Booking & { driver_name?: string; driver_mobile?: string }) | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: farmer } = await supabase.from("farmers").select("full_name").eq("id", user.id).single();
      if (farmer) setFarmerName(farmer.full_name);

      const { data: servicesData } = await supabase.from("services").select("*").eq("is_active", true).order("display_order");
      setServices(servicesData || []);

      const { data: subData } = await supabase
        .from("farmer_subscriptions")
        .select("id")
        .eq("farmer_id", user.id)
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString().slice(0, 10))
        .maybeSingle();
      setIsSubscriber(!!subData);

      const { data: activeBooking } = await supabase
        .from("bookings")
        .select("*, drivers(full_name, mobile_number)")
        .eq("farmer_id", user.id)
        .in("status", ["pending", "accepted", "started", "reached", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeBooking) {
        setCurrentBooking({
          ...activeBooking,
          driver_name: (activeBooking as any).drivers?.full_name,
          driver_mobile: (activeBooking as any).drivers?.mobile_number,
        });
      }

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);

      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-hero px-5 pb-8 pt-6">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-sm text-white/80">नमस्कार 🙏</p>
            <h1 className="text-xl font-bold text-white">{loading ? "..." : farmerName || "शेतकरी"}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/farmer/notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/farmer/profile" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <User className="h-5 w-5 text-white" />
            </Link>
          </div>
        </div>

        {!isSubscriber && (
          <Link href="/farmer/subscription">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-5 flex max-w-md items-center justify-between rounded-2xl bg-gradient-gold px-4 py-3.5 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white" />
                <div>
                  <p className="text-sm font-bold text-white">सदस्य व्हा — ५०% सूट मिळवा</p>
                  <p className="text-xs text-white/85">फक्त ₹550/एकर/वर्ष</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white" />
            </motion.div>
          </Link>
        )}
      </div>

      <div className="mx-auto -mt-4 max-w-md px-5">
        {/* Current booking card */}
        {currentBooking && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-5 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">सद्य बुकिंग</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[currentBooking.status]}`}>
                {STATUS_LABELS[currentBooking.status]}
              </span>
            </div>
            <p className="mb-1 text-sm text-gray-500">बुकिंग क्र. {currentBooking.booking_number}</p>
            <p className="mb-3 text-lg font-bold text-gray-900">{formatCurrency(currentBooking.final_amount)}</p>

            {currentBooking.driver_name ? (
              <div className="flex items-center justify-between rounded-2xl bg-primary-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Tractor className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{currentBooking.driver_name}</p>
                    <p className="text-xs text-gray-500">{currentBooking.driver_mobile}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${currentBooking.driver_mobile}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600">
                    <Phone className="h-4 w-4 text-white" />
                  </a>
                  <Link href={`/farmer/bookings/${currentBooking.id}/chat`} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </Link>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">ड्रायव्हर शोधत आहोत...</p>
            )}

            <Link href={`/farmer/bookings/${currentBooking.id}`} className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-primary-700">
              संपूर्ण तपशील पहा <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}

        {/* Quick actions */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Link href="/farmer/booking/new" className="glass-card flex flex-col items-center gap-2 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-hero">
              <Tractor className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">नवीन बुकिंग</span>
          </Link>
          <Link href="/farmer/bookings" className="glass-card flex flex-col items-center gap-2 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600">
              <History className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">इतिहास</span>
          </Link>
          <Link href="/farmer/invoices" className="glass-card flex flex-col items-center gap-2 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-earth-500 to-amber-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700">पावती</span>
          </Link>
        </div>

        {/* Services */}
        <h2 className="mb-3 text-sm font-bold text-gray-700">आमच्या सेवा</h2>
        <div className="flex flex-col gap-2.5">
          {services.map((service) => (
            <div key={service.id} className="glass-card flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                  <Tractor className="h-5 w-5 text-primary-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{service.name}</span>
              </div>
              <div className="text-right">
                {isSubscriber ? (
                  <>
                    <p className="text-xs text-gray-400 line-through">₹{service.price_per_acre}</p>
                    <p className="text-sm font-bold text-primary-700">₹{Math.round(service.price_per_acre * 0.5)}/एकर</p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-gray-900">₹{service.price_per_acre}/एकर</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
