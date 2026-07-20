"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Loader2, Tractor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminBottomNav } from "@/components/AdminBottomNav";

const STATUS_LABELS: Record<string, string> = { pending: "प्रतीक्षेत", approved: "मंजूर", rejected: "नाकारले" };
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", approved: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700",
};

export default function AdminDriversPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase.from("drivers").select("*").order("created_at", { ascending: false }).limit(100);
      if (statusFilter !== "all") query = query.eq("approval_status", statusFilter);
      if (search.trim()) query = query.or(`full_name.ilike.%${search.trim()}%,mobile_number.ilike.%${search.trim()}%,village.ilike.%${search.trim()}%`);
      const { data } = await query;
      setDrivers(data || []);
      setLoading(false);
    }
    load();
  }, [supabase, search, statusFilter]);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-sky-600 to-blue-700 px-5 pb-6 pt-6">
        <h1 className="text-xl font-bold text-white">ड्रायव्हर व्यवस्थापन</h1>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="नाव, मोबाईल किंवा गावाने शोधा..."
            className="input-field pl-11"
          />
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s} onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-semibold ${statusFilter === s ? "bg-sky-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {s === "all" ? "सर्व" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div>
        ) : drivers.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Tractor className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">कोणीही सापडले नाही</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {drivers.map((d) => (
              <Link key={d.id} href={`/admin/drivers/${d.id}`} className="glass-card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{d.full_name}</p>
                  <p className="text-xs text-gray-500">{d.mobile_number} · {d.village}</p>
                  <p className="text-xs text-gray-400">{d.tractor_brand} · ⭐ {d.rating}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_COLORS[d.approval_status]}`}>
                  {STATUS_LABELS[d.approval_status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AdminBottomNav active="drivers" />
    </main>
  );
}
