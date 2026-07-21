"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadDocument } from "@/lib/upload";
import { DocumentUpload } from "@/components/DocumentUpload";

interface FarmEntry {
  id: string;
  village: string;
  surveyNumber: string;
  areaAcre: string;
  documentUrl: string | null;
  documentType: "pdf" | "image";
}

export default function FarmerRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: personal details
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [village, setVillage] = useState("");
  const [aadharFront, setAadharFront] = useState<string | null>(null);
  const [aadharBack, setAadharBack] = useState<string | null>(null);

  // Step 2: farms (7/12)
  const [farms, setFarms] = useState<FarmEntry[]>([
    { id: crypto.randomUUID(), village: "", surveyNumber: "", areaAcre: "", documentUrl: null, documentType: "pdf" },
  ]);

  function addFarm() {
    setFarms((f) => [
      ...f,
      { id: crypto.randomUUID(), village: "", surveyNumber: "", areaAcre: "", documentUrl: null, documentType: "pdf" },
    ]);
  }

  function removeFarm(id: string) {
    if (farms.length === 1) {
      toast.error("किमान एक ७/१२ आवश्यक आहे");
      return;
    }
    setFarms((f) => f.filter((x) => x.id !== id));
  }

  function updateFarm(id: string, patch: Partial<FarmEntry>) {
    setFarms((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function validateStep1(): boolean {
    if (!fullName.trim()) return toast.error("पूर्ण नाव टाका"), false;
    if (!address.trim()) return toast.error("पत्ता टाका"), false;
    if (!district.trim()) return toast.error("जिल्हा टाका"), false;
    if (!taluka.trim()) return toast.error("तालुका टाका"), false;
    if (!village.trim()) return toast.error("मुख्य गाव टाका"), false;
    if (!aadharFront) return toast.error("आधार कार्ड (पुढील बाजू) अपलोड करा"), false;
    if (!aadharBack) return toast.error("आधार कार्ड (मागील बाजू) अपलोड करा"), false;
    return true;
  }

  function validateStep2(): boolean {
    for (const f of farms) {
      if (!f.village.trim() || !f.surveyNumber.trim() || !f.areaAcre.trim() || !f.documentUrl) {
        toast.error("प्रत्येक ७/१२ ची संपूर्ण माहिती भरा");
        return false;
      }
      if (isNaN(Number(f.areaAcre)) || Number(f.areaAcre) <= 0) {
        toast.error("क्षेत्रफळ (एकर) योग्य टाका");
        return false;
      }
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Session संपली, पुन्हा लॉगिन करा");

      // 1. Insert farmer profile
      const { error: farmerError } = await supabase.from("farmers").insert({
        id: user.id,
        full_name: fullName,
        mobile_number: user.phone?.replace("+91", "") || "",
        address,
        district,
        taluka,
        village,
        aadhar_front_url: aadharFront,
        aadhar_back_url: aadharBack,
        approval_status: "pending",
      });
      if (farmerError) throw farmerError;

      // 2. Insert all farms (7/12 records)
      const farmRows = farms.map((f) => ({
        farmer_id: user.id,
        village: f.village,
        survey_number: f.surveyNumber,
        area_acre: Number(f.areaAcre),
        document_url: f.documentUrl!,
        document_type: f.documentType,
      }));
      const { error: farmsError } = await supabase.from("farms").insert(farmRows);
      if (farmsError) throw farmsError;

      // 3. Mark profile as registered
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, is_registered: true })
        .eq("id", user.id);
      if (profileError) throw profileError;

      toast.success("नोंदणी यशस्वी! मंजुरीसाठी पाठवले आहे.");
      router.push("/farmer/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "नोंदणी अयशस्वी झाली");
    } finally {
      setLoading(false);
    }
  }

  async function handleAadharUpload(side: "front" | "back", file: File) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Session संपली");
    const url = await uploadDocument("aadhar-documents", userData.user.id, file);
    if (side === "front") setAadharFront(url);
    else setAadharBack(url);
  }

  async function handleFarmDocUpload(farmId: string, file: File) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Session संपली");
    const url = await uploadDocument("farm-documents", userData.user.id, file);
    updateFarm(farmId, { documentUrl: url, documentType: file.type === "application/pdf" ? "pdf" : "image" });
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      {/* Progress indicator */}
      <div className="mx-auto mb-6 flex max-w-md items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "bg-primary-600" : "bg-gray-200"}`} />
        ))}
      </div>

      <div className="mx-auto max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6">
              <h1 className="mb-1 text-2xl font-bold text-gray-900">वैयक्तिक माहिती</h1>
              <p className="mb-6 text-sm text-gray-500">पायरी १ / २</p>

              <label className="mb-1.5 block text-sm font-medium text-gray-700">पूर्ण नाव *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field mb-4" placeholder="उदा. रामराव पाटील" />

              <label className="mb-1.5 block text-sm font-medium text-gray-700">पत्ता *</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field mb-4" placeholder="घर क्र., गल्ली" />

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">जिल्हा *</label>
                  <input value={district} onChange={(e) => setDistrict(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">तालुका *</label>
                  <input value={taluka} onChange={(e) => setTaluka(e.target.value)} className="input-field" />
                </div>
              </div>

              <label className="mb-1.5 block text-sm font-medium text-gray-700">मुख्य गाव *</label>
              <input value={village} onChange={(e) => setVillage(e.target.value)} className="input-field mb-6" />

              <DocumentUpload label="आधार कार्ड (पुढील बाजू)" value={aadharFront} required onUpload={(f) => handleAadharUpload("front", f)} />
              <DocumentUpload label="आधार कार्ड (मागील बाजू)" value={aadharBack} required onUpload={(f) => handleAadharUpload("back", f)} />

              <button
                onClick={() => validateStep1() && setStep(2)}
                className="btn-primary mt-4 w-full"
              >
                पुढे जा
              </button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6">
              <h1 className="mb-1 text-2xl font-bold text-gray-900">७/१२ माहिती</h1>
              <p className="mb-6 text-sm text-gray-500">पायरी २ / २ · किती वाटेल तितके शेत जोडा</p>

              <div className="flex flex-col gap-4">
                {farms.map((farm, idx) => (
                  <div key={farm.id} className="rounded-2xl border border-gray-200 bg-white/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-primary-700">शेत क्र. {idx + 1}</h3>
                      {farms.length > 1 && (
                        <button onClick={() => removeFarm(farm.id)} className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <label className="mb-1.5 block text-xs font-medium text-gray-700">गाव *</label>
                    <input
                      value={farm.village}
                      onChange={(e) => updateFarm(farm.id, { village: e.target.value })}
                      className="input-field mb-3 py-2.5 text-sm"
                    />

                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">सर्वे नंबर *</label>
                        <input
                          value={farm.surveyNumber}
                          onChange={(e) => updateFarm(farm.id, { surveyNumber: e.target.value })}
                          className="input-field py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">क्षेत्रफळ (एकर) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={farm.areaAcre}
                          onChange={(e) => updateFarm(farm.id, { areaAcre: e.target.value })}
                          className="input-field py-2.5 text-sm"
                        />
                      </div>
                    </div>

                    <DocumentUpload
                      label="७/१२ उतारा"
                      value={farm.documentUrl}
                      required
                      acceptPdf
                      onUpload={(f) => handleFarmDocUpload(farm.id, f)}
                    />
                  </div>
                ))}
              </div>

              <button onClick={addFarm} className="btn-secondary mt-4 w-full">
                <Plus className="h-4 w-4" /> आणखी ७/१२ जोडा
              </button>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">मागे</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> नोंदणी पूर्ण करा</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
