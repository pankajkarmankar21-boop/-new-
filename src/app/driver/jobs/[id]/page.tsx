"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Navigation, Phone, MessageCircle, Loader2, Camera, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateMarathi, generateCompletionOtp } from "@/lib/utils";
import { uploadDocument } from "@/lib/upload";
import type { BookingStatus } from "@/types/database";

const STEPS: { status: BookingStatus; label: string }[] = [
  { status: "accepted", label: "स्वीकारले" },
  { status: "started", label: "निघालो" },
  { status: "reached", label: "पोहोचलो" },
  { status: "in_progress", label: "काम सुरू" },
  { status: "completed", label: "काम पूर्ण" },
];

export default function DriverJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const bookingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("bookings")
      .select("*, farmers(full_name, mobile_number, village, address)")
      .eq("id", bookingId)
      .single();
    setBooking(data);

    const { data: itemsData } = await supabase
      .from("booking_items")
      .select("*, farms(village, survey_number), services(name)")
      .eq("booking_id", bookingId);
    setItems(itemsData || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const currentStepIndex = STEPS.findIndex((s) => s.status === booking?.status);

  async function advanceStatus(nextStatus: BookingStatus) {
    if (nextStatus === "completed") {
      // Generate OTP and notify farmer instead of jumping straight to completed
      const otp = generateCompletionOtp();
      const { error } = await supabase
        .from("bookings")
        .update({ completion_otp: otp })
        .eq("id", bookingId);
      if (error) {
        toast.error("OTP तयार करता आले नाही");
        return;
      }
      await supabase.from("notifications").insert({
        target_type: "farmer",
        recipient_id: booking.farmer_id,
        title: "काम पूर्ण करण्यासाठी OTP",
        body: "ड्रायव्हरला हा OTP सांगा जेणेकरून काम पूर्ण नोंदवले जाईल.",
        data: { booking_id: bookingId, otp },
      });
      setShowCompleteModal(true);
      return;
    }

    setUpdating(true);
    const { error } = await supabase.from("bookings").update({ status: nextStatus }).eq("id", bookingId);
    setUpdating(false);
    if (error) {
      toast.error("स्थिती अपडेट करता आले नाही");
    } else {
      toast.success("स्थिती अपडेट झाली");
      load();
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Session संपली");
      const url = await uploadDocument("completion-photos", userData.user.id, file);
      setPhotos((p) => [...p, url]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "फोटो अपलोड अयशस्वी");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function handleConfirmCompletion() {
    if (otpInput.length !== 6) {
      toast.error("संपूर्ण ६ अंकी OTP टाका");
      return;
    }
    if (photos.length === 0) {
      toast.error("किमान एक फोटो अपलोड करणे आवश्यक आहे");
      return;
    }

    setUpdating(true);
    const { data: current } = await supabase.from("bookings").select("completion_otp").eq("id", bookingId).single();

    if (current?.completion_otp !== otpInput) {
      toast.error("चुकीचा OTP. शेतकऱ्याकडून पुन्हा विचारा.");
      setUpdating(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "completed", completion_otp_verified: true })
      .eq("id", bookingId);

    if (updateError) {
      toast.error("काम पूर्ण नोंदवता आले नाही");
      setUpdating(false);
      return;
    }

    const photoRows = photos.map((url) => ({ booking_id: bookingId, photo_url: url }));
    await supabase.from("booking_completion_photos").insert(photoRows);

    toast.success("काम यशस्वीरित्या पूर्ण झाले!");
    setUpdating(false);
    setShowCompleteModal(false);
    router.push("/driver/jobs");
  }

  if (loading || !booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-earth-600" />
      </main>
    );
  }

  const farmer = booking.farmers;

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6 pb-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/driver/jobs" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{booking.booking_number}</h1>
        </div>

        {/* Status stepper */}
        {booking.status !== "rejected" && booking.status !== "cancelled" && (
          <div className="glass-card mb-5 p-5">
            <div className="flex items-center justify-between">
              {STEPS.map((step, i) => (
                <div key={step.status} className="flex flex-1 flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      i <= currentStepIndex ? "bg-earth-600 text-white" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {i < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="mt-1 text-center text-[9px] font-medium text-gray-500">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Farmer info */}
        <div className="glass-card mb-5 p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-700">शेतकरी तपशील</h2>
          <p className="text-base font-bold text-gray-900">{farmer?.full_name}</p>
          <p className="mb-3 text-sm text-gray-500">{farmer?.address}, {farmer?.village}</p>
          <div className="flex gap-3">
            <a href={`tel:${farmer?.mobile_number}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-earth-600 py-2.5 text-sm font-bold text-white">
              <Phone className="h-4 w-4" /> कॉल करा
            </a>
            <Link href={`/driver/jobs/${bookingId}/chat`} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-earth-600 py-2.5 text-sm font-bold text-earth-700">
              <MessageCircle className="h-4 w-4" /> Chat
            </Link>
          </div>
        </div>

        {/* Work items */}
        <div className="glass-card mb-5 p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-700">कामाचे तपशील</h2>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                <span>{item.services?.name} · {item.farms?.village} (सर्वे {item.farms?.survey_number})</span>
                <span className="font-semibold">{item.area_acre} एकर</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-bold text-gray-700">एकूण कमाई</span>
            <span className="text-lg font-extrabold text-earth-700">{formatCurrency(booking.final_amount)}</span>
          </div>
        </div>

        {/* Action button */}
        {currentStepIndex >= 0 && currentStepIndex < STEPS.length - 1 && (
          <button
            onClick={() => advanceStatus(STEPS[currentStepIndex + 1].status)}
            disabled={updating}
            className="btn-primary w-full !bg-gradient-to-br !from-earth-600 !to-amber-600"
          >
            {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : `${STEPS[currentStepIndex + 1].label} म्हणून नोंदवा`}
          </button>
        )}

        {booking.status === "completed" && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-4 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" /> <span className="font-bold">काम यशस्वीरित्या पूर्ण झाले</span>
          </div>
        )}
      </div>

      {/* Completion modal: mandatory OTP + photos */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">काम पूर्ण करा</h3>
              <button onClick={() => setShowCompleteModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              शेतकऱ्याला OTP पाठवला आहे. त्यांच्याकडून OTP विचारून खाली टाका.
            </p>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">शेतकरी OTP *</label>
            <input
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              className="input-field mb-4 text-center text-xl font-bold tracking-widest"
              placeholder="——————"
            />

            <label className="mb-1.5 block text-sm font-medium text-gray-700">कामाचे फोटो * (किमान १)</label>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <img key={i} src={url} alt="completion" className="h-20 w-full rounded-xl object-cover" />
              ))}
              <label className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
                {uploadingPhoto ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                <span className="text-[10px] font-medium">फोटो जोडा</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            <button onClick={handleConfirmCompletion} disabled={updating} className="btn-primary w-full !bg-gradient-to-br !from-earth-600 !to-amber-600">
              {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : "काम पूर्ण म्हणून नोंदवा"}
            </button>
          </motion.div>
        </div>
      )}
    </main>
  );
}
