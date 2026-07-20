"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateMarathi } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/invoice";

export default function FarmerInvoicesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [farmer, setFarmer] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: farmerData } = await supabase.from("farmers").select("full_name, mobile_number, village").eq("id", user.id).single();
      setFarmer(farmerData);

      const { data } = await supabase
        .from("payments")
        .select("*, bookings(booking_number, booking_items(area_acre, final_amount, services(name)))")
        .eq("farmer_id", user.id)
        .eq("status", "success")
        .order("created_at", { ascending: false });

      setPayments(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  function downloadInvoice(payment: any) {
    if (!farmer) return;
    const items = payment.subscription_id
      ? [{ description: "Annual Subscription (Kisan Jutai)", amount: payment.amount }]
      : (payment.bookings?.booking_items || []).map((bi: any) => ({
          description: `${bi.services?.name || "Service"} (${bi.area_acre} acre)`,
          amount: bi.final_amount,
        }));

    const doc = generateInvoicePdf({
      invoiceNumber: payment.invoice_number,
      date: payment.created_at,
      farmerName: farmer.full_name,
      farmerMobile: farmer.mobile_number,
      farmerVillage: farmer.village,
      bookingNumber: payment.bookings?.booking_number,
      type: payment.subscription_id ? "subscription" : "booking",
      items,
      discount: 0,
      total: payment.amount,
    });
    doc.save(`${payment.invoice_number}.pdf`);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/farmer/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">पावती इतिहास</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
        ) : payments.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">अजून कोणतीही पावती नाही</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((p) => (
              <div key={p.id} className="glass-card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.invoice_number}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateMarathi(p.created_at)} · {p.subscription_id ? "सदस्यता" : p.bookings?.booking_number}
                  </p>
                  <p className="mt-1 text-sm font-bold text-primary-700">{formatCurrency(p.amount)}</p>
                </div>
                <button onClick={() => downloadInvoice(p)} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <Download className="h-4 w-4 text-primary-700" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
