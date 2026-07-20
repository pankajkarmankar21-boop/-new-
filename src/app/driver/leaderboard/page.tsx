"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { DriverBottomNav } from "@/components/DriverBottomNav";

interface LeaderRow {
  driver_id: string;
  driver_name: string;
  village: string;
  jobs_completed: number;
  total_earnings: number;
  rank: number;
  incentive_amount: number;
  is_me: boolean;
}

export default function LeaderboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [myVillage, setMyVillage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: driver } = await supabase.from("drivers").select("village").eq("id", user.id).single();
      const village = driver?.village || "";
      setMyVillage(village);

      const now = new Date();
      const periodKey = period === "monthly"
        ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        : `${now.getFullYear()}`;

      const { data: snapshots } = await supabase
        .from("driver_leaderboard_snapshots")
        .select("*, drivers(full_name, village)")
        .eq("period_type", period)
        .eq("period_key", periodKey)
        .eq("village", village)
        .order("rank", { ascending: true });

      const mapped: LeaderRow[] = (snapshots || []).map((s: any) => ({
        driver_id: s.driver_id,
        driver_name: s.drivers?.full_name || "",
        village: s.village,
        jobs_completed: s.jobs_completed,
        total_earnings: s.total_earnings,
        rank: s.rank,
        incentive_amount: s.incentive_amount,
        is_me: s.driver_id === user.id,
      }));

      setRows(mapped);
      setLoading(false);
    }
    load();
  }, [supabase, period]);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-earth-600 to-amber-600 px-5 pb-6 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-white" />
          <h1 className="text-xl font-bold text-white">लीडरबोर्ड</h1>
        </div>
        <p className="text-sm text-white/80">{myVillage} गाव</p>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="mb-5 flex gap-2">
          <button
            onClick={() => setPeriod("monthly")}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${period === "monthly" ? "bg-earth-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            मासिक
          </button>
          <button
            onClick={() => setPeriod("yearly")}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${period === "yearly" ? "bg-earth-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            वार्षिक
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-earth-600" /></div>
        ) : rows.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Trophy className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">या कालावधीसाठी अजून डेटा नाही</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map((row) => (
              <div
                key={row.driver_id}
                className={`glass-card flex items-center gap-3 p-4 ${row.is_me ? "ring-2 ring-earth-500" : ""}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${
                  row.rank === 1 ? "bg-amber-500" : row.rank === 2 ? "bg-gray-400" : row.rank === 3 ? "bg-earth-600" : "bg-gray-300"
                }`}>
                  {row.rank <= 3 ? <Medal className="h-5 w-5" /> : row.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{row.driver_name} {row.is_me && <span className="text-earth-600">(तुम्ही)</span>}</p>
                  <p className="text-xs text-gray-500">{row.jobs_completed} कामे · {formatCurrency(row.total_earnings)}</p>
                </div>
                {row.incentive_amount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    +{formatCurrency(row.incentive_amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DriverBottomNav active="leaderboard" />
    </main>
  );
}
