"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Check, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateMarathi } from "@/lib/utils";

export default function AdminDriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  async function load() {
    const [driverRes, jobsRes] = await Promise.all([
      supabase.from("drivers").select("*").eq("id", driverId).single(),
      supabase.from("bookings").select("id, booking_number, status, final_amount, booking_date").eq("assigned_driver_id", driverId).order("created_at", { ascending: false }).limit(10),
    ]);
    setDriver(driverRes.data);
    setJobs(jobsRes.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [driverId]);

  async function handleApprove() {
    setProcessing(true);
    const { error } = await supabase.from("drivers").update({ approval_status: "approved", rejection_reason: null }).eq("id", driverId);
    setProcessing(false);
    if (error) toast.error("मंजूर करता आले नाही");
    else { toast.success("ड्रायव्हर मंजूर केला"); load(); }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error("कारण लिहा"); return; }
    setProcessing(true);
    const { error } = await supabase.from("drivers").update({ approval_status: "rejected", rejection_reason: rejectReason }).eq("id", driverId);
    setProcessing(false);
    if (error) toast.error("नाकारता आले नाही");
    else { toast.success("नाकारले"); setShowRejectBox(false); load(); }
  }

  if (loading || !driver) {
    return <main className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <button onClick={() => router.push("/admin/drivers")} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{driver.full_name}</h1>
        </div>

        <div className="glass-card mb-4 p-5">
          <p className="mb-1 text-sm text-gray-700"><span className="text-gray-400">मोबाईल:</span> {driver.mobile_number}</p>
          <p className="mb-1 text-sm text-gray-700"><span className="text-gray-400">पत्ता:</span> {driver.address}, {driver.village}</p>
          <p className="mb-1 text-sm text-gray-700"><span className="text-gray-400">ट्रॅक्टर:</span> {driver.tractor_brand} · {driver.tractor_company}</p>
          <p className="text-sm text-gray-700"><span className="text-gray-400">रेटिंग:</span> ⭐ {driver.rating}</p>
          {driver.rejection_reason && (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">नाकारण्याचे कारण: {driver.rejection_reason}</p>
          )}
        </div>

        <div className="glass-card mb-4 p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-700">कागदपत्रे</h2>
          <div className="grid grid-cols-2 gap-3">
            <img src={driver.aadhar_front_url} alt="Aadhar Front" className="rounded-xl border border-gray-200" />
            <img src={driver.aadhar_back_url} alt="Aadhar Back" className="rounded-xl border border-gray-200" />
            <img src={driver.tractor_photo_url} alt="Tractor" className="rounded-xl border border-gray-200" />
            <a href={driver.rc_book_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-sky-700">
              <FileText className="h-4 w-4" /> RC Book
            </a>
          </div>
          <a href={driver.driving_licence_url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm text-sky-700">
            <FileText className="h-4 w-4" /> Driving Licence पहा
          </a>
        </div>

        <div className="glass-card mb-4 p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-700">अलीकडील कामे</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-400">कोणतेही काम नाही</p>
          ) : (
            <div className="flex flex-col gap-2">
              {jobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                  <span>{j.booking_number} · {formatDateMarathi(j.booking_date)}</span>
                  <span className="font-semibold">{formatCurrency(j.final_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {driver.approval_status === "pending" && (
          <div className="flex gap-3">
            <button onClick={() => setShowRejectBox(true)} disabled={processing} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600">
              <X className="h-4 w-4" /> नाकारा
            </button>
            <button onClick={handleApprove} disabled={processing} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-hero py-3.5 text-sm font-bold text-white">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> मंजूर करा</>}
            </button>
          </div>
        )}

        {showRejectBox && (
          <div className="mt-4 glass-card p-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">नाकारण्याचे कारण</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="input-field mb-3" />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectBox(false)} className="btn-secondary flex-1">रद्द करा</button>
              <button onClick={handleReject} disabled={processing} className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white">नाकारा</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
