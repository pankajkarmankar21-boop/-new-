import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

/**
 * Uploads a file (image or PDF) to a Supabase Storage bucket under the
 * current user's own folder (required by our RLS storage policies).
 * Images are compressed client-side before upload; PDFs pass through as-is.
 */
export async function uploadDocument(
  bucket: "aadhar-documents" | "farm-documents" | "driver-documents" | "completion-photos" | "chat-images",
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient();

  let fileToUpload: File | Blob = file;
  let extension = file.name.split(".").pop() || "jpg";

  const isImage = file.type.startsWith("image/");
  if (isImage) {
    try {
      fileToUpload = await imageCompression(file, COMPRESSION_OPTIONS);
      extension = "jpg";
    } catch {
      // If compression fails, upload the original file rather than blocking the user
      fileToUpload = file;
    }
  }

  const fileName = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, fileToUpload, {
    cacheControl: "3600",
    upsert: false,
    contentType: isImage ? "image/jpeg" : file.type,
  });

  if (error) throw new Error(`अपलोड अयशस्वी: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

/** Returns a short-lived signed URL for viewing a private document (admin use) */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
