"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { AdminBottomNav } from "@/components/AdminBottomNav";

const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"];

interface VillageStat { village: string; farmers: number; drivers: number; totalAcre: number; revenue: number; }
interface ServiceStat { service: string; bookings: number; revenue: number; }

export default function AdminAnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [villageStats, setVillageStats] = useState<VillageStat[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [farmersRes, driversRes, farmsRes, itemsRes] = await Promise.all([
        supabase.from("farmers").select("village"),
        supabase.from("drivers").select("village"),
        supabase.from("farms").select("village, area_acre"),
        supabase
          .from("booking_items")
          .select("final_amount, services(name), farms(village), bookings!inner(payment_status)")
          .eq("bookings.payment_status", "success"),
      ]);

      const villageMap: Record<string, VillageStat> = {};
      const ensureVillage = (v: string) => {
        if (!villageMap[v]) villageMap[v] = { village: v, farmers: 0, drivers: 0, totalAcre: 0, revenue: 0 };
        return villageMap[v];
      };
      (farmersRes.data || []).forEach((f: any) => { ensureVillage(f.village).farmers++; });
      (driversRes.data || []).forEach((d: any) => { ensureVillage(d.village).drivers++; });
      (farmsRes.data || []).forEach((f: any) => { ensureVillage(f.village).totalAcre += Number(f.area_acre); });

      const serviceMap: Record<string, ServiceStat> = {};
      (itemsRes.data || []).forEach((item: any) => {
        const village = item.farms?.village;
        if (village) ensureVillage(village).revenue += Number(item.final_amount);

        const serviceName = item.services?.name || "इतर";
        if (!serviceMap[serviceName]) serviceMap[serviceName] = { service: serviceName, bookings: 0, revenue: 0 };
        serviceMap[serviceName].bookings += 1;
        serviceMap[serviceName].revenue += Number(item.final_amount);
      });

      setVillageStats(Object.values(villageMap).sort((a, b) => b.revenue - a.revenue));
      setServiceStats(Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue));
      setLoading(false);
    }
    load();
  }, [supabase]);

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    const villageSheet = XLSX.utils.json_to_sheet(
      villageStats.map((v) => ({
        Village: v.village, Farmers: v.farmers, Drivers: v.drivers,
        "Total Acre": v.totalAcre.toFixed(2), "Revenue (INR)": v.revenue,
      }))
    );
    const serviceSheet = XLSX.utils.json_to_sheet(
      serviceStats.map((s) => ({ Service: s.service, Bookings: s.bookings, "Revenue (INR)": s.revenue }))
    );
    XLSX.utils.book_append_sheet(wb, villageSheet, "Village Wise");
    XLSX.utils.book_append_sheet(wb, serviceSheet, "Service Wise");
    XLSX.writeFile(wb, `kisan-jutai-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74);
    doc.text("Kisan Jutai - Analytics Report", 14, 18);

    autoTable(doc, {
      startY: 28,
      head: [["Village", "Farmers", "Drivers", "Total Acre", "Revenue (INR)"]],
      body: villageStats.map((v) => [v.village, v.farmers, v.drivers, v.totalAcre.toFixed(2), v.revenue.toFixed(2)]),
      headStyles: { fillColor: [22, 163, 74] },
    });

    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Service Wise", 14, y1);
    autoTable(doc, {
      startY: y1 + 4,
      head: [["Service", "Bookings", "Revenue (INR)"]],
      body: serviceStats.map((s) => [s.service, s.bookings, s.revenue.toFixed(2)]),
      headStyles: { fillColor: [14, 165, 233] },
    });

    doc.save(`kisan-jutai-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-sky-600 to-blue-700 px-5 pb-6 pt-6">
        <h1 className="text-xl font-bold text-white">Analytics</h1>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="mb-5 flex gap-3">
          <button onClick={exportPdf} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white border border-gray-200 py-3 text-sm font-semibold text-gray-700 shadow-sm">
            <Download className="h-4 w-4" /> PDF Export
          </button>
          <button onClick={exportExcel} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white border border-gray-200 py-3 text-sm font-semibold text-gray-700 shadow-sm">
            <FileSpreadsheet className="h-4 w-4" /> Excel Export
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div>
        ) : (
          <>
            <div className="glass-card mb-5 p-5">
              <h2 className="mb-3 text-sm font-bold text-gray-700">गाव-निहाय महसूल</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={villageStats.slice(0, 6)}>
                  <XAxis dataKey="village" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card mb-5 p-5">
              <h2 className="mb-3 text-sm font-bold text-gray-700">सेवा-निहाय बुकिंग वाटप</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={serviceStats} dataKey="bookings" nameKey="service" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 10 }}>
                    {serviceStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <h2 className="mb-3 text-sm font-bold text-gray-700">गाव-निहाय तपशील</h2>
            <div className="mb-5 flex flex-col gap-2">
              {villageStats.map((v) => (
                <div key={v.village} className="glass-card p-4">
                  <p className="mb-1 text-sm font-bold text-gray-900">{v.village}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{v.farmers} शेतकरी</span>
                    <span>{v.drivers} ड्रायव्हर</span>
                    <span>{v.totalAcre.toFixed(1)} एकर</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-primary-700">{formatCurrency(v.revenue)}</p>
                </div>
              ))}
            </div>

            <h2 className="mb-3 text-sm font-bold text-gray-700">सेवा-निहाय तपशील</h2>
            <div className="flex flex-col gap-2">
              {serviceStats.map((s) => (
                <div key={s.service} className="glass-card flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{s.service}</p>
                    <p className="text-xs text-gray-500">{s.bookings} बुकिंग</p>
                  </div>
                  <span className="text-sm font-bold text-sky-700">{formatCurrency(s.revenue)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AdminBottomNav active="analytics" />
    </main>
  );
}
