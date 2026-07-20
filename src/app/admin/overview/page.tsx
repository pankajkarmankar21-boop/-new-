"use client";

import { useEffect, useState } from "react";
import { Users, Tractor, ClipboardList, IndianRupee, Sparkles, Wrench, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { AdminBottomNav } from "@/components/AdminBottomNav";

export default function AdminOverviewPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalDrivers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    subscriptionRevenue: 0,
    serviceRevenue: 0,
    pendingFarmerApprovals: 0,
    pendingDriverApprovals: 0,
  });
  const [villageRevenue, setVillageRevenue] = useState<{ village: string; revenue: number }[]>([]);

  useEffect(() => {
    async function load() {
      const [farmersCount, driversCount, bookingsCount, payments, pendingFarmers, pendingDrivers] = await Promise.all([
        supabase.from("farmers").select("*", { count: "exact", head: true }),
        supabase.from("drivers").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount, subscription_id, booking_id, bookings(farmers(village))").eq("status", "success"),
        supabase.from("farmers").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("drivers").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
      ]);

      const paymentRows = payments.data || [];
      const subscriptionRevenue = paymentRows.filter((p: any) => p.subscription_id).reduce((s: number, p: any) => s + Number(p.amount), 0);
      const serviceRevenue = paymentRows.filter((p: any) => p.booking_id).reduce((s: number, p: any) => s + Number(p.amount), 0);

      const villageMap: Record<string, number> = {};
      paymentRows.forEach((p: any) => {
        const village = p.bookings?.farmers?.village;
        if (village) villageMap[village] = (villageMap[village] || 0) + Number(p.amount);
      });
      const villageRevenueList = Object.entries(villageMap)
        .map(([village, revenue]) => ({ village, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setStats({
        totalFarmers: farmersCount.count || 0,
        totalDrivers: driversCount.count || 0,
        totalBookings: bookingsCount.count || 0,
        totalRevenue: subscriptionRevenue + serviceRevenue,
        subscriptionRevenue,
        serviceRevenue,
        pendingFarmerApprovals: pendingFarmers.count || 0,
        pendingDriverApprovals: pendingDrivers.count || 0,
      });
      setVillageRevenue(villageRevenueList);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-sky-600 to-blue-700 px-5 pb-6 pt-6">
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-white/80">किसान जुताई — संपूर्ण नियंत्रण</p>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        {(stats.pendingFarmerApprovals > 0 || stats.pendingDriverApprovals > 0) && (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
            {stats.pendingFarmerApprovals > 0 && (
              <p className="text-sm text-amber-700">🕐 {stats.pendingFarmerApprovals} शेतकरी मंजुरीच्या प्रतीक्षेत</p>
            )}
            {stats.pendingDriverApprovals > 0 && (
              <p className="text-sm text-amber-700">🕐 {stats.pendingDriverApprovals} ड्रायव्हर मंजुरीच्या प्रतीक्षेत</p>
            )}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <Users className="mb-2 h-5 w-5 text-primary-600" />
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalFarmers}</p>
            <p className="text-xs text-gray-500">एकूण शेतकरी</p>
          </div>
          <div className="glass-card p-4">
            <Tractor className="mb-2 h-5 w-5 text-earth-600" />
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalDrivers}</p>
            <p className="text-xs text-gray-500">एकूण ड्रायव्हर</p>
          </div>
          <Link href="/admin/bookings" className="glass-card p-4">
            <ClipboardList className="mb-2 h-5 w-5 text-sky-600" />
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalBookings}</p>
            <p className="text-xs text-gray-500">एकूण बुकिंग</p>
          </Link>
          <div className="glass-card p-4">
            <IndianRupee className="mb-2 h-5 w-5 text-emerald-600" />
            <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500">एकूण महसूल</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-2.5">
          <div className="glass-card flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-700">Subscription महसूल</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(stats.subscriptionRevenue)}</span>
          </div>
          <div className="glass-card flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-sky-500" />
              <span className="text-sm font-semibold text-gray-700">Service महसूल</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(stats.serviceRevenue)}</span>
          </div>
        </div>

        <h2 className="mb-3 text-sm font-bold text-gray-700">Top गावे (महसूलानुसार)</h2>
        <div className="flex flex-col gap-2">
          {villageRevenue.map((v) => (
            <div key={v.village} className="glass-card flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-gray-800">{v.village}</span>
              <span className="text-sm font-bold text-primary-700">{formatCurrency(v.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      <AdminBottomNav active="overview" />
    </main>
  );
}
