"use client";

import { useState } from "react";
import { Send, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AdminBottomNav } from "@/components/AdminBottomNav";

type TargetType = "all" | "village" | "farmer_specific" | "driver_specific";

export default function AdminBroadcastPage() {
  const supabase = createClient();
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [village, setVillage] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title आणि Message दोन्ही आवश्यक आहेत");
      return;
    }
    if (targetType === "village" && !village.trim()) {
      toast.error("गावाचे नाव टाका");
      return;
    }

    setSending(true);
    try {
      if (targetType === "all") {
        await supabase.from("notifications").insert({ target_type: "all", title, body });
      } else if (targetType === "village") {
        await supabase.from("notifications").insert({ target_type: "village", target_village: village.trim(), title, body });
      } else {
        // Fan out to every farmer or every driver individually
        const table = targetType === "farmer_specific" ? "farmers" : "drivers";
        const { data: recipients } = await supabase.from(table).select("id");
        const rows = (recipients || []).map((r: any) => ({
          target_type: targetType === "farmer_specific" ? "farmer" : "driver",
          recipient_id: r.id,
          title,
          body,
        }));
        if (rows.length > 0) await supabase.from("notifications").insert(rows);
      }

      toast.success("सूचना पाठवली!");
      setTitle("");
      setBody("");
      setVillage("");
    } catch {
      toast.error("पाठवता आले नाही");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-sky-600 to-blue-700 px-5 pb-6 pt-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-white" />
          <h1 className="text-xl font-bold text-white">सूचना पाठवा</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-5">
        <label className="mb-2 block text-sm font-bold text-gray-700">कोणाला पाठवायचे?</label>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {[
            { key: "all", label: "सर्वांना" },
            { key: "village", label: "गाव-निहाय" },
            { key: "farmer_specific", label: "सर्व शेतकरी" },
            { key: "driver_specific", label: "सर्व ड्रायव्हर" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTargetType(t.key as TargetType)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${targetType === t.key ? "bg-sky-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {targetType === "village" && (
          <>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">गावाचे नाव</label>
            <input value={village} onChange={(e) => setVillage(e.target.value)} className="input-field mb-4" placeholder="उदा. वाघोली" />
          </>
        )}

        <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field mb-4" placeholder="उदा. उद्या सुट्टी" />

        <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="input-field mb-5" placeholder="संपूर्ण संदेश लिहा..." />

        <button onClick={handleSend} disabled={sending} className="btn-primary w-full !bg-gradient-to-br !from-sky-600 !to-blue-700">
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" /> पाठवा</>}
        </button>
      </div>

      <AdminBottomNav active="broadcast" />
    </main>
  );
}
