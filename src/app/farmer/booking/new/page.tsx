"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import type { Farm, Service } from "@/types/database";

interface BookingLine {
  id: string;
  farmId: string;
  serviceId: string;
}

export default function NewBookingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { pay } = useRazorpayCheckout();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [farmerName, setFarmerName] = useState("");
  const [farmerMobile, setFarmerMobile] = useState("");
  const [lines, setLines] = useState<BookingLine[]>([{ id: crypto.randomUUID(), farmId: "", serviceId: "" }]);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const [farmerRes, farmsRes, servicesRes, subRes] = await Promise.all([
        supabase.from("farmers").select("full_name, mobile_number").eq("id", user.id).single(),
        supabase.from("farms").select("*").eq("farmer_id", user.id).order("created_at"),
        supabase.from("services").select("*").eq("is_active", true).order("display_order"),
        supabase
          .from("farmer_subscriptions")
          .select("id")
          .eq("farmer_id", user.id)
          .eq("is_active", true)
          .gte("end_date", new Date().toISOString().slice(0, 10))
          .maybeSingle(),
      ]);

      if (farmerRes.data) {
        setFarmerName(farmerRes.data.full_name);
        setFarmerMobile(farmerRes.data.mobile_number);
      }
      setFarms(farmsRes.data || []);
      setServices(servicesRes.data || []);
      setIsSubscriber(!!subRes.data);
      if (farmsRes.data && farmsRes.data.length > 0) {
        setLines([{ id: crypto.randomUUID(), farmId: farmsRes.data[0].id, serviceId: "" }]);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  function addLine() {
    setLines((prev) => [...prev, { id: crypto.randomUUID(), farmId: "", serviceId: "" }]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.id !== id)));
  }

  function updateLine(id: string, patch: Partial<BookingLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  const computedLines = useMemo(() => {
    return lines.map((line) => {
      const farm = farms.find((f) => f.id === line.farmId);
      const service = services.find((s) => s.id === line.serviceId);
      const area = farm ? Number(farm.area_acre) : 0;
      const rate = service ? Number(service.price_per_acre) : 0;
      const amount = area * rate;
      const discountPercent = isSubscriber ? 50 : 0;
      const finalAmount = isSubscriber ? Math.round(amount * 0.5) : amount;
      return { ...line, farm, service, area, rate, amount, discountPercent, finalAmount };
    });
  }, [lines, farms, services, isSubscriber]);

  const totalAmount = computedLines.reduce((s, l) => s + l.amount, 0);
  const totalDiscount = computedLines.reduce((s, l) => s + (l.amount - l.finalAmount), 0);
  const finalTotal = totalAmount - totalDiscount;

  function validate(): boolean {
    if (farms.length === 0) {
      toast.error("आधी किमान एक ७/१२ नोंदणी करा");
      return false;
    }
    for (const l of computedLines) {
      if (!l.farmId || !l.serviceId) {
        toast.error("प्रत्येक ओळीत शेत आणि सेवा निवडा");
        return false;
      }
    }
    // Prevent duplicate farm+service combos
    const keys = new Set<string>();
    for (const l of lines) {
      const k = `${l.farmId}-${l.serviceId}`;
      if (keys.has(k)) {
        toast.error("एकाच शेतासाठी एकच सेवा दोनदा निवडली आहे");
        return false;
      }
      keys.add(k);
    }
    return true;
  }

  async function handleCreateBooking() {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Login आवश्यक आहे");

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          farmer_id: user.id,
          booking_date: bookingDate,
          notes: notes || null,
          total_amount: totalAmount,
          discount_applied: totalDiscount,
          final_amount: finalTotal,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (bookingError || !booking) throw new Error("बुकिंग तयार करता आले नाही");

      const items = computedLines.map((l) => ({
        booking_id: booking.id,
        farm_id: l.farmId,
        service_id: l.serviceId,
        area_acre: l.area,
        rate_per_acre: l.rate,
        amount: l.amount,
        discount_percent: l.discountPercent,
        final_amount: l.finalAmount,
      }));

      const { error: itemsError } = await supabase.from("booking_items").insert(items);
      if (itemsError) throw new Error("Booking items जतन करता आले नाहीत");

      await pay({
        type: "booking",
        id: booking.id,
        farmerName,
        farmerMobile,
        onSuccess: () => {
          toast.success("बुकिंग यशस्वी! ड्रायव्हर लवकरच नियुक्त होईल.");
          router.push(`/farmer/bookings/${booking.id}`);
        },
        onFailure: () => setSubmitting(false),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "काहीतरी चूक झाली");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6 pb-40">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/farmer/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">नवीन बुकिंग</h1>
        </div>

        {isSubscriber && (
          <div className="mb-4 rounded-2xl bg-gradient-gold px-4 py-3 text-center text-sm font-bold text-white">
            🎉 सदस्य सूट लागू — सर्व सेवांवर ५०% सूट
          </div>
        )}

        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <CalendarDays className="h-4 w-4" /> बुकिंग तारीख
        </label>
        <input
          type="date"
          value={bookingDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setBookingDate(e.target.value)}
          className="input-field mb-5"
        />

        <h2 className="mb-3 text-sm font-bold text-gray-700">शेत व सेवा निवडा</h2>
        <div className="flex flex-col gap-3">
          {computedLines.map((line, idx) => (
            <div key={line.id} className="rounded-2xl border border-gray-200 bg-white/90 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary-700">Farm {idx + 1}</h3>
                {lines.length > 1 && (
                  <button onClick={() => removeLine(line.id)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <label className="mb-1.5 block text-xs font-medium text-gray-700">शेत निवडा</label>
              <select
                value={line.farmId}
                onChange={(e) => updateLine(line.id, { farmId: e.target.value })}
                className="input-field mb-3 py-2.5 text-sm"
              >
                <option value="">-- निवडा --</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.village} · सर्वे {f.survey_number} · {f.area_acre} एकर
                  </option>
                ))}
              </select>

              <label className="mb-1.5 block text-xs font-medium text-gray-700">सेवा निवडा</label>
              <select
                value={line.serviceId}
                onChange={(e) => updateLine(line.id, { serviceId: e.target.value })}
                className="input-field mb-3 py-2.5 text-sm"
              >
                <option value="">-- निवडा --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₹{s.price_per_acre}/एकर
                  </option>
                ))}
              </select>

              {line.farm && line.service && (
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                  <span className="text-gray-500">
                    {line.area} एकर × ₹{line.rate}
                    {isSubscriber && <span className="text-primary-600"> (५०% सूट)</span>}
                  </span>
                  <span className="font-bold text-gray-900">{formatCurrency(line.finalAmount)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={addLine} className="btn-secondary mt-4 w-full">
          <Plus className="h-4 w-4" /> आणखी शेत/सेवा जोडा
        </button>

        <label className="mb-1.5 mt-5 block text-sm font-medium text-gray-700">टिपा (ऐच्छिक)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input-field"
          placeholder="ड्रायव्हरसाठी काही सूचना असल्यास लिहा..."
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-xl px-5 py-4">
        <div className="mx-auto max-w-md">
          {totalDiscount > 0 && (
            <div className="mb-1 flex justify-between text-sm text-gray-500 line-through">
              <span>मूळ किंमत</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          )}
          <div className="mb-3 flex justify-between text-lg">
            <span className="font-bold text-gray-900">एकूण रक्कम</span>
            <span className="font-extrabold text-primary-700">{formatCurrency(finalTotal)}</span>
          </div>
          <button onClick={handleCreateBooking} disabled={submitting} className="btn-primary w-full">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "पैसे भरा व बुक करा"}
          </button>
        </div>
      </div>
    </main>
  );
}
