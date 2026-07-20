"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isValidMobile } from "@/lib/utils";
import Link from "next/link";

type Step = "mobile" | "otp";

export default function FarmerLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  async function handleSendOtp() {
    if (!isValidMobile(mobile)) {
      toast.error("कृपया योग्य १० अंकी मोबाईल नंबर टाका");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${mobile}`,
    });
    setLoading(false);

    if (error) {
      toast.error("OTP पाठवताना अडचण आली: " + error.message);
      return;
    }
    toast.success("OTP पाठवला आहे");
    setStep("otp");
    startResendTimer();
  }

  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("कृपया संपूर्ण ६ अंकी OTP टाका");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${mobile}`,
      token: code,
      type: "sms",
    });

    if (error || !data.user) {
      setLoading(false);
      toast.error("चुकीचा OTP. पुन्हा प्रयत्न करा.");
      return;
    }

    // Ensure profile row exists (role = farmer)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, is_registered")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        role: "farmer",
        mobile_number: mobile,
        is_registered: false,
      });
    }

    setLoading(false);

    if (!existingProfile || !existingProfile.is_registered) {
      router.push("/farmer/register");
    } else {
      router.push("/farmer/home");
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-hero px-6 py-10">
      <Link href="/" className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
        <ArrowLeft className="h-5 w-5 text-white" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mt-6 flex flex-1 flex-col p-6"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 shadow-lg">
          {step === "mobile" ? (
            <Phone className="h-8 w-8 text-white" />
          ) : (
            <ShieldCheck className="h-8 w-8 text-white" />
          )}
        </div>

        {step === "mobile" ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">शेतकरी लॉगिन</h1>
            <p className="mt-1 mb-6 text-sm text-gray-500">तुमचा मोबाईल नंबर टाका, आम्ही OTP पाठवू</p>

            <label className="mb-1.5 text-sm font-medium text-gray-700">मोबाईल नंबर</label>
            <div className="mb-6 flex items-center gap-2">
              <span className="input-field flex w-16 items-center justify-center px-2 py-3.5 text-gray-600">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="input-field flex-1"
                autoFocus
              />
            </div>

            <button onClick={handleSendOtp} disabled={loading} className="btn-primary mt-auto">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "OTP पाठवा"}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">OTP टाका</h1>
            <p className="mt-1 mb-6 text-sm text-gray-500">+91 {mobile} वर पाठवलेला ६ अंकी कोड टाका</p>

            <div className="mb-6 flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="input-field h-14 w-12 text-center text-xl font-bold"
                />
              ))}
            </div>

            <button onClick={handleVerifyOtp} disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "पडताळणी करा"}
            </button>

            <button
              onClick={handleSendOtp}
              disabled={resendTimer > 0}
              className="mt-4 text-sm font-medium text-primary-700 disabled:text-gray-400"
            >
              {resendTimer > 0 ? `पुन्हा OTP पाठवा (${resendTimer}s)` : "पुन्हा OTP पाठवा"}
            </button>
          </>
        )}
      </motion.div>
    </main>
  );
}
