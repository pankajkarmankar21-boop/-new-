"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2, Tractor } from "lucide-react";
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

const PAGE_SIZE = 10;

export default function FarmerBookingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      let query = supabase
        .from("bookings")
        .select("*, drivers(full_name)", { count: "exact" })
        .eq("farmer_id", user.id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (filter === "active") {
        query = query.in("status", ["pending", "accepted", "started", "reached", "in_progress"]);
      } else if (filter === "completed") {
        query = query.eq("status", "completed");
      }
      if (search.trim()) {
        query = query.ilike("booking_number", `%${search.trim()}%`);
      }

      const { data, count } = await query;
      setBookings(data || []);
      setTotalCount(count || 0);
      setLoading(false);
    }
    load();
  }, [supabase, filter, search, page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/farmer/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">बुकिंग इतिहास</h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="बुकिंग क्रमांकाने शोधा..."
            className="input-field pl-11"
          />
        </div>

        <div className="mb-5 flex gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${filter === f ? "bg-primary-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {f === "all" ? "सर्व" : f === "active" ? "सुरू" : "पूर्ण"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
        ) : bookings.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Tractor className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">कोणतीही बुकिंग सापडली नाही</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <Link key={b.id} href={`/farmer/bookings/${b.id}`} className="glass-card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{b.booking_number}</p>
                  <p className="text-xs text-gray-500">{formatDateMarathi(b.booking_date)}{b.drivers?.full_name ? ` · ${b.drivers.full_name}` : ""}</p>
                  <p className="mt-1 text-sm font-bold text-primary-700">{formatCurrency(b.final_amount)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_COLORS[b.status]}`}>{STATUS_LABELS[b.status]}</span>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">मागे</button>
            <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">पुढे</button>
          </div>
        )}
      </div>
    </main>
  );
}
