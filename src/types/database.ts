export type UserRole = "farmer" | "driver" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "started"
  | "reached"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "qr";

export interface Profile {
  id: string;
  role: UserRole;
  mobile_number: string;
  full_name: string | null;
  is_registered: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: string;
  full_name: string;
  mobile_number: string;
  address: string;
  district: string;
  taluka: string;
  village: string;
  aadhar_front_url: string | null;
  aadhar_back_url: string | null;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  farmer_id: string;
  village: string;
  survey_number: string;
  area_acre: number;
  document_url: string;
  document_type: "pdf" | "image";
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  mobile_number: string;
  address: string;
  village: string;
  tractor_brand: string;
  tractor_company: string;
  rc_book_url: string;
  driving_licence_url: string;
  aadhar_front_url: string;
  aadhar_back_url: string;
  tractor_photo_url: string;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  is_available: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  price_per_acre: number;
  unit: "acre";
  is_active: boolean;
  display_order: number;
}

export interface Booking {
  id: string;
  booking_number: string;
  farmer_id: string;
  booking_date: string;
  notes: string | null;
  total_amount: number;
  discount_applied: number;
  final_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  assigned_driver_id: string | null;
  completion_otp: string | null;
  completion_otp_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  farm_id: string;
  service_id: string;
  area_acre: number;
  rate_per_acre: number;
  amount: number;
  discount_percent: number;
  final_amount: number;
}

// Minimal Supabase Database generic — extend via `supabase gen types typescript`
// Run: npx supabase gen types typescript --project-id <your-project-ref> > src/types/database.ts
// after connecting your real project, to get the fully generated version.
//
// NOTE: This uses a permissive `Record<string, ...>` shape rather than mixing
// explicit named keys with an index signature. Mixing the two causes
// @supabase/supabase-js's generic table lookup to resolve unknown table
// names (notifications, chat_messages, payments, etc.) to `never`, which
// breaks `.insert()` / `.update()` calls with a "does not exist in type
// 'never[]'" build error. Once you generate real types from your live
// Supabase project, replace this with the full generated file for proper
// per-table type safety.
export interface Database {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any }>;
  };
}
