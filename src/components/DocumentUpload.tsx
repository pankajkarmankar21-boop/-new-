"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, FileText, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadProps {
  label: string;
  value: string | null;
  onUpload: (file: File) => Promise<void>;
  acceptPdf?: boolean;
  required?: boolean;
}

export function DocumentUpload({ label, value, onUpload, acceptPdf = false, required }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMb = file.type === "application/pdf" ? 10 : 15;
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`फाईल साईझ ${maxSizeMb}MB पेक्षा जास्त आहे`);
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
      toast.success(`${label} अपलोड झाले`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "अपलोड अयशस्वी");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {acceptPdf && <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />}

      {value && !uploading ? (
        <div className="flex items-center justify-between rounded-2xl border-2 border-primary-200 bg-primary-50 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-primary-800">अपलोड यशस्वी</span>
          </div>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="text-xs font-semibold text-primary-700 underline"
          >
            बदला
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => cameraInputRef.current?.click()}
            className="input-field flex flex-1 flex-col items-center gap-1.5 py-4 text-gray-600 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            <span className="text-xs font-medium">कॅमेरा</span>
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => galleryInputRef.current?.click()}
            className="input-field flex flex-1 flex-col items-center gap-1.5 py-4 text-gray-600 disabled:opacity-60"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs font-medium">गॅलरी</span>
          </button>
          {acceptPdf && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => pdfInputRef.current?.click()}
              className="input-field flex flex-1 flex-col items-center gap-1.5 py-4 text-gray-600 disabled:opacity-60"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">PDF</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
