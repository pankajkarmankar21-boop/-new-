"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadDocument } from "@/lib/upload";
import { DocumentUpload } from "@/components/DocumentUpload";

export default function DriverRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [village, setVillage] = useState("");
  const [tractorBrand, setTractorBrand] = useState("");
  const [tractorCompany, setTractorCompany] = useState("");

  const [rcBook, setRcBook] = useState<string | null>(null);
  const [licence, setLicence] = useState<string | null>(null);
  const [aadharFront, setAadharFront] = useState<string | null>(null);
  const [aadharBack, setAadharBack] = useState<string | null>(null);
  const [tractorPhoto, setTractorPhoto] = useState<string | null>(null);

  async function uploadFor(setter: (url: string) => void, file: File) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Session संपली");
    const url = await uploadDocument("driver-documents", userData.user.id, file);
    setter(url);
  }

  function validate(): boolean {
    if (!fullName.trim()) return toast.error("पूर्ण नाव टाका"), false;
    if (!address.trim()) return toast.error("पत्ता टाका"), false;
    if (!village.trim()) return toast.error("गाव टाका"), false;
    if (!tractorBrand.trim()) return toast.error("ट्रॅक्टर Brand टाका"), false;
    if (!tractorCompany.trim()) return toast.error("Company टाका"), false;
    if (!rcBook) return toast.error("RC Book अपलोड करा"), false;
    if (!licence) return toast.error("Driving Licence अपलोड करा"), false;
    if (!aadharFront) return toast.error("आधार (पुढील) अपलोड करा"), false;
    if (!aadharBack) return toast.error("आधार (मागील) अपलोड करा"), false;
    if (!tractorPhoto) return toast.error("ट्रॅक्टर फोटो अपलोड करा"), false;
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Session संपली, पुन्हा लॉगिन करा");

      const { error: driverError } = await supabase.from("drivers").insert({
        id: user.id,
        full_name: fullName,
        mobile_number: user.phone?.replace("+91", "") || "",
        address,
        village,
        tractor_brand: tractorBrand,
        tractor_company: tractorCompany,
        rc_book_url: rcBook!,
        driving_licence_url: licence!,
        aadhar_front_url: aadharFront!,
        aadhar_back_url: aadharBack!,
        tractor_photo_url: tractorPhoto!,
        approval_status: "pending",
      });
      if (driverError) throw driverError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, is_registered: true })
        .eq("id", user.id);
      if (profileError) throw profileError;

      toast.success("नोंदणी यशस्वी! मंजुरीसाठी पाठवले आहे.");
      router.push("/driver/requests");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "नोंदणी अयशस्वी झाली");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-md">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">ड्रायव्हर नोंदणी</h1>
          <p className="mb-6 text-sm text-gray-500">सर्व माहिती व कागदपत्रे भरा</p>

          <label className="mb-1.5 block text-sm font-medium text-gray-700">पूर्ण नाव *</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field mb-4" placeholder="उदा. सुरेश पवार" />

          <label className="mb-1.5 block text-sm font-medium text-gray-700">पत्ता *</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field mb-4" />

          <label className="mb-1.5 block text-sm font-medium text-gray-700">गाव *</label>
          <input value={village} onChange={(e) => setVillage(e.target.value)} className="input-field mb-4" />

          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">ट्रॅक्टर Brand *</label>
              <input value={tractorBrand} onChange={(e) => setTractorBrand(e.target.value)} className="input-field" placeholder="Mahindra" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Company *</label>
              <input value={tractorCompany} onChange={(e) => setTractorCompany(e.target.value)} className="input-field" placeholder="575 DI" />
            </div>
          </div>

          <DocumentUpload label="RC Book" value={rcBook} required acceptPdf onUpload={(f) => uploadFor(setRcBook, f)} />
          <DocumentUpload label="Driving Licence" value={licence} required acceptPdf onUpload={(f) => uploadFor(setLicence, f)} />
          <DocumentUpload label="आधार कार्ड (पुढील बाजू)" value={aadharFront} required onUpload={(f) => uploadFor(setAadharFront, f)} />
          <DocumentUpload label="आधार कार्ड (मागील बाजू)" value={aadharBack} required onUpload={(f) => uploadFor(setAadharBack, f)} />
          <DocumentUpload label="ट्रॅक्टर फोटो" value={tractorPhoto} required onUpload={(f) => uploadFor(setTractorPhoto, f)} />

          <button onClick={handleSubmit} disabled={loading} className="btn-primary mt-4 w-full !bg-gradient-to-br !from-earth-600 !to-amber-600">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> नोंदणी पूर्ण करा</>}
          </button>
        </motion.div>
      </div>
    </main>
  );
}
