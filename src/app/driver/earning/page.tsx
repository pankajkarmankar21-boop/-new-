"use client";

import { useEffect, useState } from "react";
import { Wallet, Loader2, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateMarathi } from "@/lib/utils";
import { DriverBottomNav } from "@/components/DriverBottomNav";

export default function DriverEarningsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data } = await supabase
        .from("bookings")
        .select("id, booking_number, final_amount, updated_at, farmers(village)")
        .eq("assigned_driver_id", user.id)
        .eq("status", "completed")
        .order("updated_at", { ascending: false });

      const list = data || [];
      setJobs(list);
      setTotalEarnings(list.reduce((s, j: any) => s + Number(j.final_amount), 0));

      const now = new Date();
      const thisMonth = list.filter((j: any) => {
        const d = new Date(j.updated_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      setMonthEarnings(thisMonth.reduce((s, j: any) => s + Number(j.final_amount), 0));
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-earth-600 to-amber-600 px-5 pb-6 pt-6">
        <div className="mb-1 flex items-center gap-2">
          <Wallet className="h-6 w-6 text-white" />
          <h1 className="text-xl font-bold text-white">माझी कमाई</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <p className="text-xs font-medium text-gray-500">एकूण कमाई</p>
            <p className="mt-1 text-xl font-extrabold text-earth-700">{formatCurrency(totalEarnings)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium text-gray-500">या महिन्यात</p>
            <p className="mt-1 flex items-center gap-1 text-xl font-extrabold text-primary-700">
              <TrendingUp className="h-4 w-4" /> {formatCurrency(monthEarnings)}
            </p>
          </div>
        </div>

        <h2 className="mb-3 text-sm font-bold text-gray-700">पूर्ण झालेली कामे</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-earth-600" /></div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-gray-400">अजून कोणतीही कमाई नाही</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {jobs.map((job: any) => (
              <div key={job.id} className="glass-card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{job.booking_number}</p>
                  <p className="text-xs text-gray-500">{job.farmers?.village} · {formatDateMarathi(job.updated_at)}</p>
                </div>
                <span className="text-sm font-extrabold text-earth-700">{formatCurrency(job.final_amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DriverBottomNav active="earnings" />
    </main>
  );
}
