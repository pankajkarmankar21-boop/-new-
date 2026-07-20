"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Star, Tractor, Trophy, Edit2, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import Link from "next/link";

export default function DriverProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driver, setDriver] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [village, setVillage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const { data } = await supabase.from("drivers").select("*").eq("id", user.id).single();
      setDriver(data);
      setAddress(data?.address || "");
      setVillage(data?.village || "");
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("drivers").update({ address, village }).eq("id", driver.id);
    setSaving(false);
    if (error) {
      toast.error("जतन करता आले नाही");
    } else {
      toast.success("प्रोफाईल अपडेट झाले");
      setDriver({ ...driver, address, village });
      setEditing(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading || !driver) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-earth-600" />
      </main>
    );
  }

  const approvalLabel = { pending: "मंजुरीच्या प्रतीक्षेत", approved: "मंजूर", rejected: "नाकारले" }[driver.approval_status as string];
  const approvalColor = { pending: "bg-amber-100 text-amber-700", approved: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700" }[driver.approval_status as string];

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-earth-600 to-amber-600 px-5 pb-8 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white backdrop-blur">
            {driver.full_name?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{driver.full_name}</h1>
            <p className="text-sm text-white/80">{driver.mobile_number}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="mb-4 flex gap-3">
          <div className="glass-card flex-1 p-4 text-center">
            <Star className="mx-auto mb-1 h-5 w-5 text-amber-500" />
            <p className="text-lg font-extrabold text-gray-900">{driver.rating}</p>
            <p className="text-xs text-gray-500">रेटिंग</p>
          </div>
          <span className={`glass-card flex flex-1 flex-col items-center justify-center p-4 text-center text-xs font-bold ${approvalColor} !bg-transparent`}>
            <span className={`rounded-full px-3 py-1 ${approvalColor}`}>{approvalLabel}</span>
          </span>
        </div>

        <Link href="/driver/leaderboard" className="glass-card mb-4 flex items-center gap-3 p-4">
          <Trophy className="h-6 w-6 text-amber-500" />
          <span className="text-sm font-bold text-gray-800">लीडरबोर्ड पहा</span>
        </Link>

        <div className="glass-card mb-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">वैयक्तिक माहिती</h2>
            <button onClick={() => (editing ? handleSave() : setEditing(true))} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin text-earth-600" /> : editing ? <Save className="h-4 w-4 text-earth-600" /> : <Edit2 className="h-4 w-4 text-earth-600" />}
            </button>
          </div>

          {editing ? (
            <>
              <label className="mb-1 block text-xs font-medium text-gray-500">पत्ता</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field mb-3 py-2.5 text-sm" />
              <label className="mb-1 block text-xs font-medium text-gray-500">गाव</label>
              <input value={village} onChange={(e) => setVillage(e.target.value)} className="input-field py-2.5 text-sm" />
            </>
          ) : (
            <>
              <p className="mb-1 text-sm text-gray-700"><span className="text-gray-400">पत्ता:</span> {driver.address}</p>
              <p className="text-sm text-gray-700"><span className="text-gray-400">गाव:</span> {driver.village}</p>
            </>
          )}
        </div>

        <div className="glass-card mb-6 p-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-700">
            <Tractor className="h-4 w-4" /> ट्रॅक्टर तपशील
          </h2>
          <p className="text-sm text-gray-700">{driver.tractor_brand} · {driver.tractor_company}</p>
        </div>

        <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600">
          <LogOut className="h-4 w-4" /> लॉगआउट
        </button>
      </div>

      <DriverBottomNav active="profile" />
    </main>
  );
}
