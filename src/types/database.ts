export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "farmer" | "driver" | "admin";
          mobile_number: string;
          full_name: string | null;
          is_registered: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "farmer" | "driver" | "admin";
          mobile_number: string;
          full_name?: string | null;
          is_registered?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "farmer" | "driver" | "admin";
          mobile_number?: string;
          full_name?: string | null;
          is_registered?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      farmers: {
        Row: {
          id: string;
          full_name: string;
          mobile_number: string;
          address: string;
          district: string;
          taluka: string;
          village: string;
          aadhar_front_url: string | null;
          aadhar_back_url: string | null;
          approval_status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          mobile_number: string;
          address: string;
          district: string;
          taluka: string;
          village: string;
          aadhar_front_url?: string | null;
          aadhar_back_url?: string | null;
          approval_status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          mobile_number?: string;
          address?: string;
          district?: string;
          taluka?: string;
          village?: string;
          aadhar_front_url?: string | null;
          aadhar_back_url?: string | null;
          approval_status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "farmers_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      farms: {
        Row: {
          id: string;
          farmer_id: string;
          village: string;
          survey_number: string;
          area_acre: number;
          document_url: string;
          document_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          village: string;
          survey_number: string;
          area_acre: number;
          document_url: string;
          document_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          village?: string;
          survey_number?: string;
          area_acre?: number;
          document_url?: string;
          document_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "farms_farmer_id_fkey";
            columns: ["farmer_id"];
            isOneToOne: false;
            referencedRelation: "farmers";
            referencedColumns: ["id"];
          },
        ];
      };

      drivers: {
        Row: {
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
          approval_status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          is_available: boolean;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
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
          approval_status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          is_available?: boolean;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          mobile_number?: string;
          address?: string;
          village?: string;
          tractor_brand?: string;
          tractor_company?: string;
          rc_book_url?: string;
          driving_licence_url?: string;
          aadhar_front_url?: string;
          aadhar_back_url?: string;
          tractor_photo_url?: string;
          approval_status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          is_available?: boolean;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      village_neighbors: {
        Row: {
          id: string;
          village: string;
          neighbor_village: string;
          district: string;
          taluka: string;
        };
        Insert: {
          id?: string;
          village: string;
          neighbor_village: string;
          district: string;
          taluka: string;
        };
        Update: {
          id?: string;
          village?: string;
          neighbor_village?: string;
          district?: string;
          taluka?: string;
        };
        Relationships: [];
      };

      services: {
        Row: {
          id: string;
          name: string;
          price_per_acre: number;
          unit: "acre";
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price_per_acre: number;
          unit?: "acre";
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price_per_acre?: number;
          unit?: "acre";
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      subscription_plans: {
        Row: {
          id: string;
          price_per_acre_per_year: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          price_per_acre_per_year?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          price_per_acre_per_year?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      farmer_subscriptions: {
        Row: {
          id: string;
          farmer_id: string;
          plan_id: string;
          covers_all_farms: boolean;
          total_acre: number;
          amount: number;
          start_date: string;
          end_date: string;
          payment_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          plan_id: string;
          covers_all_farms?: boolean;
          total_acre: number;
          amount: number;
          start_date?: string;
          end_date: string;
          payment_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          plan_id?: string;
          covers_all_farms?: boolean;
          total_acre?: number;
          amount?: number;
          start_date?: string;
          end_date?: string;
          payment_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "farmer_subscriptions_farmer_id_fkey";
            columns: ["farmer_id"];
            isOneToOne: false;
            referencedRelation: "farmers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "farmer_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_sub_payment";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };

      farmer_subscription_farms: {
        Row: {
          subscription_id: string;
          farm_id: string;
        };
        Insert: {
          subscription_id: string;
          farm_id: string;
        };
        Update: {
          subscription_id?: string;
          farm_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "farmer_subscription_farms_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "farmer_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "farmer_subscription_farms_farm_id_fkey";
            columns: ["farm_id"];
            isOneToOne: false;
            referencedRelation: "farms";
            referencedColumns: ["id"];
          },
        ];
      };

      bookings: {
        Row: {
          id: string;
          booking_number: string;
          farmer_id: string;
          booking_date: string;
          notes: string | null;
          total_amount: number;
          discount_applied: number;
          final_amount: number;
          status:
            | "pending"
            | "accepted"
            | "rejected"
            | "started"
            | "reached"
            | "in_progress"
            | "completed"
            | "cancelled";
          payment_status: "pending" | "success" | "failed" | "refunded";
          assigned_driver_id: string | null;
          completion_otp: string | null;
          completion_otp_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_number?: string;
          farmer_id: string;
          booking_date: string;
          notes?: string | null;
          total_amount: number;
          discount_applied?: number;
          final_amount: number;
          status?:
            | "pending"
            | "accepted"
            | "rejected"
            | "started"
            | "reached"
            | "in_progress"
            | "completed"
            | "cancelled";
          payment_status?: "pending" | "success" | "failed" | "refunded";
          assigned_driver_id?: string | null;
          completion_otp?: string | null;
          completion_otp_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_number?: string;
          farmer_id?: string;
          booking_date?: string;
          notes?: string | null;
          total_amount?: number;
          discount_applied?: number;
          final_amount?: number;
          status?:
            | "pending"
            | "accepted"
            | "rejected"
            | "started"
            | "reached"
            | "in_progress"
            | "completed"
            | "cancelled";
          payment_status?: "pending" | "success" | "failed" | "refunded";
          assigned_driver_id?: string | null;
          completion_otp?: string | null;
          completion_otp_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_farmer_id_fkey";
            columns: ["farmer_id"];
            isOneToOne: false;
            referencedRelation: "farmers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_assigned_driver_id_fkey";
            columns: ["assigned_driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };

      booking_items: {
        Row: {
          id: string;
          booking_id: string;
          farm_id: string;
          service_id: string;
          area_acre: number;
          rate_per_acre: number;
          amount: number;
          discount_percent: number;
          final_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          farm_id: string;
          service_id: string;
          area_acre: number;
          rate_per_acre: number;
          amount: number;
          discount_percent?: number;
          final_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          farm_id?: string;
          service_id?: string;
          area_acre?: number;
          rate_per_acre?: number;
          amount?: number;
          discount_percent?: number;
          final_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_items_farm_id_fkey";
            columns: ["farm_id"];
            isOneToOne: false;
            referencedRelation: "farms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };

      booking_notifications_log: {
        Row: {
          id: string;
          booking_id: string;
          driver_id: string;
          notified_at: string;
          responded: boolean;
        };
        Insert: {
          id?: string;
          booking_id: string;
          driver_id: string;
          notified_at?: string;
          responded?: boolean;
        };
        Update: {
          id?: string;
          booking_id?: string;
          driver_id?: string;
          notified_at?: string;
          responded?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "booking_notifications_log_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_notifications_log_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };

      booking_status_history: {
        Row: {
          id: string;
          booking_id: string;
          status:
            | "pending"
            | "accepted"
            | "rejected"
            | "started"
            | "reached"
            | "in_progress"
            | "completed"
            | "cancelled";
          changed_by: string | null;
          reason: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          status:
            | "pending"
            | "accepted"
            | "rejected"
            | "started"
            | "reached"
            | "in_progress"
            | "completed"
            | "cancelled";
          changed_by?: string | null;
          reason?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          status?:
            | "pending"
            | "accepted"
            | "rejected"
            | "started"
            | "reached"
            | "in_progress"
            | "completed"
            | "cancelled";
          changed_by?: string | null;
          reason?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      booking_completion_photos: {
        Row: {
          id: string;
          booking_id: string;
          photo_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          photo_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          photo_url?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_completion_photos_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };

      payments: {
        Row: {
          id: string;
          farmer_id: string;
          booking_id: string | null;
          subscription_id: string | null;
          amount: number;
          method: "upi" | "card" | "netbanking" | "wallet" | "qr";
          status: "pending" | "success" | "failed" | "refunded";
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          invoice_number: string | null;
          invoice_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          booking_id?: string | null;
          subscription_id?: string | null;
          amount: number;
          method: "upi" | "card" | "netbanking" | "wallet" | "qr";
          status?: "pending" | "success" | "failed" | "refunded";
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          invoice_number?: string | null;
          invoice_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          booking_id?: string | null;
          subscription_id?: string | null;
          amount?: number;
          method?: "upi" | "card" | "netbanking" | "wallet" | "qr";
          status?: "pending" | "success" | "failed" | "refunded";
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          invoice_number?: string | null;
          invoice_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_farmer_id_fkey";
            columns: ["farmer_id"];
            isOneToOne: false;
            referencedRelation: "farmers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "farmer_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };

      chat_messages: {
        Row: {
          id: string;
          booking_id: string;
          sender_id: string;
          message: string | null;
          image_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          sender_id: string;
          message?: string | null;
          image_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          sender_id?: string;
          message?: string | null;
          image_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      notifications: {
        Row: {
          id: string;
          target_type: "farmer" | "driver" | "village" | "all";
          target_village: string | null;
          recipient_id: string | null;
          title: string;
          body: string;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: "farmer" | "driver" | "village" | "all";
          target_village?: string | null;
          recipient_id?: string | null;
          title: string;
          body: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          target_type?: "farmer" | "driver" | "village" | "all";
          target_village?: string | null;
          recipient_id?: string | null;
          title?: string;
          body?: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      driver_leaderboard_snapshots: {
        Row: {
          id: string;
          driver_id: string;
          period_type: string;
          period_key: string;
          village: string;
          jobs_completed: number;
          total_earnings: number;
          rank: number | null;
          incentive_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          period_type: string;
          period_key: string;
          village: string;
          jobs_completed?: number;
          total_earnings?: number;
          rank?: number | null;
          incentive_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          period_type?: string;
          period_key?: string;
          village?: string;
          jobs_completed?: number;
          total_earnings?: number;
          rank?: number | null;
          incentive_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_leaderboard_snapshots_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };

      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      auth_role: {
        Args: Record<string, never>;
        Returns: "farmer" | "driver" | "admin";
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      notify_nearby_drivers: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      refresh_driver_leaderboard: {
        Args: { p_period_type: string; p_period_key: string; p_village: string };
        Returns: undefined;
      };
    };

    Enums: {
      user_role: "farmer" | "driver" | "admin";
      approval_status: "pending" | "approved" | "rejected";
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "started"
        | "reached"
        | "in_progress"
        | "completed"
        | "cancelled";
      payment_status: "pending" | "success" | "failed" | "refunded";
      payment_method: "upi" | "card" | "netbanking" | "wallet" | "qr";
      notification_target: "farmer" | "driver" | "village" | "all";
      service_unit: "acre";
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ---------------------------------------------------------------
// Convenience helpers (same shape supabase gen types typescript adds)
// ---------------------------------------------------------------
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// ---------------------------------------------------------------
// App-level named aliases — used throughout the codebase for readable
// component prop types (e.g. `Booking`, `Farm`, `Service`).
// ---------------------------------------------------------------
export type Profile = Tables<"profiles">;
export type Farmer = Tables<"farmers">;
export type Farm = Tables<"farms">;
export type Driver = Tables<"drivers">;
export type VillageNeighbor = Tables<"village_neighbors">;
export type Service = Tables<"services">;
export type SubscriptionPlan = Tables<"subscription_plans">;
export type FarmerSubscription = Tables<"farmer_subscriptions">;
export type FarmerSubscriptionFarm = Tables<"farmer_subscription_farms">;
export type Booking = Tables<"bookings">;
export type BookingItem = Tables<"booking_items">;
export type BookingNotificationLog = Tables<"booking_notifications_log">;
export type BookingStatusHistory = Tables<"booking_status_history">;
export type BookingCompletionPhoto = Tables<"booking_completion_photos">;
export type Payment = Tables<"payments">;
export type ChatMessage = Tables<"chat_messages">;
export type Notification = Tables<"notifications">;
export type PushSubscription = Tables<"push_subscriptions">;
export type DriverLeaderboardSnapshot = Tables<"driver_leaderboard_snapshots">;
export type AuditLog = Tables<"audit_logs">;

export type UserRole = Enums<"user_role">;
export type ApprovalStatus = Enums<"approval_status">;
export type BookingStatus = Enums<"booking_status">;
export type PaymentStatus = Enums<"payment_status">;
export type PaymentMethod = Enums<"payment_method">;
export type NotificationTarget = Enums<"notification_target">;
export type ServiceUnit = Enums<"service_unit">;
