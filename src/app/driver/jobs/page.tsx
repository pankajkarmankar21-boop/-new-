"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateMarathi } from "@/lib/utils";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import type { Booking } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  accepted: "स्वीकारले",
  started: "निघालो",
  reached: "पोहोचलो",
  in_progress: "काम सुरू",
  completed: "काम पूर्ण",
};
const STATUS_COLORS: Record<string, string> = {
  accepted: "bg-sky-100 text-sky-700",
  started: "bg-indigo-100 text-indigo-700",
  reached: "bg-purple-100 text-purple-700",
  in_progress: "bg-primary-100 text-primary-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default function DriverJobsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<(Booking & { farmer_village?: string })[]>([]);
  const [history, setHistory] = useState<(Booking & { farmer_village?: string })[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, farmers(village)")
        .eq("assigned_driver_id", user.id)
        .order("created_at", { ascending: false });

      const mapped = (bookings || []).map((b: any) => ({ ...b, farmer_village: b.farmers?.village }));
      setActive(mapped.filter((b) => b.status !== "completed" && b.status !== "cancelled" && b.status !== "rejected"));
      setHistory(mapped.filter((b) => b.status === "completed"));
      setLoading(false);
    }
    load();
  }, [supabase]);

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
        <h1 className="text-xl font-bold text-white">माझी कामे</h1>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        <h2 className="mb-3 text-sm font-bold text-gray-700">सुरू असलेली कामे</h2>
        {active.length === 0 ? (
          <div className="glass-card mb-6 flex flex-col items-center gap-2 px-6 py-8 text-center">
            <Briefcase className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">सध्या कोणतेही सुरू काम नाही</p>
          </div>
        ) : (
          <div className="mb-6 flex flex-col gap-3">
            {active.map((job) => (
              <Link key={job.id} href={`/driver/jobs/${job.id}`} className="glass-card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{job.booking_number}</p>
                  <p className="text-xs text-gray-500">{job.farmer_village} · {formatDateMarathi(job.booking_date)}</p>
                  <p className="mt-1 text-sm font-bold text-earth-700">{formatCurrency(job.final_amount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_COLORS[job.status]}`}>
                    {STATUS_LABELS[job.status]}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <h2 className="mb-3 text-sm font-bold text-gray-700">पूर्ण झालेली कामे</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">अजून कोणतेही काम पूर्ण झालेले नाही</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((job) => (
              <Link key={job.id} href={`/driver/jobs/${job.id}`} className="glass-card flex items-center justify-between p-4 opacity-80">
                <div>
                  <p className="text-sm font-bold text-gray-900">{job.booking_number}</p>
                  <p className="text-xs text-gray-500">{job.farmer_village} · {formatDateMarathi(job.booking_date)}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">पूर्ण</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <DriverBottomNav active="jobs" />
    </main>
  );
}
