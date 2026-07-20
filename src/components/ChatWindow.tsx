"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadDocument } from "@/lib/upload";

interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string | null;
  image_url: string | null;
  created_at: string;
}

interface ChatWindowProps {
  bookingId: string;
  otherPartyName: string;
  otherPartyRole: "शेतकरी" | "ड्रायव्हर";
  backHref: string;
  themeGradient?: string;
}

export function ChatWindow({ bookingId, otherPartyName, otherPartyRole, backHref, themeGradient = "from-primary-600 to-emerald-600" }: ChatWindowProps) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      setUserId(uid);

      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setLoading(false);

      // Mark incoming messages as read
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("booking_id", bookingId)
        .neq("sender_id", uid);
    }
    init();

    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim()) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      booking_id: bookingId,
      sender_id: userId,
      message: text.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("पाठवता आले नाही");
    } else {
      setText("");
    }
  }

  async function sendImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadDocument("chat-images", userId, file);
      await supabase.from("chat_messages").insert({
        booking_id: bookingId,
        sender_id: userId,
        image_url: url,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "फोटो पाठवता आले नाही");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  return (
    <main className="flex h-screen flex-col bg-gray-100">
      <div className={`flex items-center gap-3 bg-gradient-to-br ${themeGradient} px-4 py-4 shadow-md`}>
        <button onClick={() => router.push(backHref)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div>
          <p className="text-base font-bold text-white">{otherPartyName}</p>
          <p className="text-xs text-white/80">{otherPartyRole}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-400">संभाषण सुरू करा...</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {messages.map((msg) => {
              const isMine = msg.sender_id === userId;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMine ? "bg-primary-600 text-white" : "bg-white text-gray-900"
                    }`}
                  >
                    {msg.image_url ? (
                      <img src={msg.image_url} alt="chat" className="max-w-full rounded-xl" />
                    ) : (
                      <p className="text-sm">{msg.message}</p>
                    )}
                    <p className={`mt-1 text-[10px] ${isMine ? "text-white/70" : "text-gray-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("mr-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-3">
        <label className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
          {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin text-gray-500" /> : <ImageIcon className="h-5 w-5 text-gray-500" />}
          <input type="file" accept="image/*" className="hidden" onChange={sendImage} />
        </label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="मेसेज टाका..."
          className="input-field flex-1 py-2.5"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Send className="h-5 w-5 text-white" />}
        </button>
      </div>
    </main>
  );
}
