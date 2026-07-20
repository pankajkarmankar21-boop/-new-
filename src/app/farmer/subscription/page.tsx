"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, calculateSubscriptionAmount } from "@/lib/utils";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import type { Farm } from "@/types/database";

const PRICE_PER_ACRE = 550;

export default function SubscriptionPage() {
  const router = useRouter();
  const supabase = createClient();
  const { pay } = useRazorpayCheckout();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"all" | "specific">("all");
  const [farmerName, setFarmerName] = useState("");
  const [farmerMobile, setFarmerMobile] = useState("");
  const [alreadyActive, setAlreadyActive] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: farmerData } = await supabase
        .from("farmers")
        .select("full_name, mobile_number")
        .eq("id", user.id)
        .single();
      if (farmerData) {
        setFarmerName(farmerData.full_name);
        setFarmerMobile(farmerData.mobile_number);
      }

      const { data: farmsData } = await supabase
        .from("farms")
        .select("*")
        .eq("farmer_id", user.id)
        .order("created_at", { ascending: true });
      setFarms(farmsData || []);
      setSelectedIds(new Set((farmsData || []).map((f) => f.id)));

      const { data: activeSub } = await supabase
        .from("farmer_subscriptions")
        .select("id")
        .eq("farmer_id", user.id)
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString().slice(0, 10))
        .maybeSingle();
      setAlreadyActive(!!activeSub);

      setLoading(false);
    }
    load();
  }, [supabase]);

  function toggleFarm(id: string) {
    setMode("specific");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setMode("all");
    setSelectedIds(new Set(farms.map((f) => f.id)));
  }

  const selectedFarms = farms.filter((f) => selectedIds.has(f.id));
  const totalAcre = selectedFarms.reduce((sum, f) => sum + Number(f.area_acre), 0);
  const totalAmount = calculateSubscriptionAmount(totalAcre, PRICE_PER_ACRE);

  async function handleSubscribe() {
    if (selectedFarms.length === 0) {
      toast.error("किमान एक शेत निवडा");
      return;
    }
    setProcessing(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Login आवश्यक आहे");

      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("is_active", true)
        .single();
      if (!plan) throw new Error("Subscription plan सापडले नाही");

      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const { data: subscription, error: subError } = await supabase
        .from("farmer_subscriptions")
        .insert({
          farmer_id: user.id,
          plan_id: plan.id,
          covers_all_farms: mode === "all",
          total_acre: totalAcre,
          amount: totalAmount,
          end_date: endDate.toISOString().slice(0, 10),
          is_active: false,
        })
        .select()
        .single();
      if (subError || !subscription) throw new Error("Subscription तयार करता आले नाही");

      const links = selectedFarms.map((f) => ({ subscription_id: subscription.id, farm_id: f.id }));
      await supabase.from("farmer_subscription_farms").insert(links);

      await pay({
        type: "subscription",
        id: subscription.id,
        farmerName,
        farmerMobile,
        onSuccess: () => {
          toast.success("सदस्यता सक्रिय झाली!");
          router.push("/farmer/home");
        },
        onFailure: () => setProcessing(false),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "काहीतरी चूक झाली");
      setProcessing(false);
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
    <main className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/farmer/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">वार्षिक सदस्यता</h1>
        </div>

        {alreadyActive && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-primary-50 border border-primary-200 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-primary-800">तुमची सदस्यता आधीच सक्रिय आहे</span>
          </div>
        )}

        <div className="glass-card mb-4 overflow-hidden">
          <div className="bg-gradient-gold px-5 py-4">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5" />
              <span className="font-bold">सदस्यता फायदे</span>
            </div>
            <p className="mt-1 text-sm text-white/90">सर्व सेवांवर ५०% सूट, वर्षभर वैध</p>
          </div>
          <div className="p-5">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-gray-900">₹550</span>
              <span className="text-sm text-gray-500">/ एकर / वर्ष</span>
            </div>
          </div>
        </div>

        <h2 className="mb-3 text-sm font-bold text-gray-700">शेत निवडा</h2>

        <div className="mb-3 flex gap-2">
          <button
            onClick={selectAll}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${mode === "all" ? "bg-primary-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            सर्व शेत ({farms.length})
          </button>
          <button
            onClick={() => setMode("specific")}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${mode === "specific" ? "bg-primary-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            ठराविक शेत निवडा
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-2">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => toggleFarm(farm.id)}
              className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3.5 text-left transition ${selectedIds.has(farm.id) ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white"}`}
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{farm.village} · सर्वे {farm.survey_number}</p>
                <p className="text-xs text-gray-500">{farm.area_acre} एकर</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedIds.has(farm.id) ? "border-primary-600 bg-primary-600" : "border-gray-300"}`}>
                {selectedIds.has(farm.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
              </div>
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card sticky bottom-4 p-5">
          <div className="mb-1 flex justify-between text-sm text-gray-600">
            <span>एकूण क्षेत्रफळ</span>
            <span className="font-semibold">{totalAcre.toFixed(2)} एकर</span>
          </div>
          <div className="mb-4 flex justify-between text-lg">
            <span className="font-bold text-gray-900">एकूण रक्कम</span>
            <span className="font-extrabold text-primary-700">{formatCurrency(totalAmount)}</span>
          </div>
          <button onClick={handleSubscribe} disabled={processing || alreadyActive} className="btn-primary w-full">
            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : "सदस्यता घ्या व पैसे भरा"}
          </button>
        </motion.div>
      </div>
    </main>
  );
}
