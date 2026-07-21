import type {
  Booking,
  BookingItem,
  Driver,
  Farm,
  Farmer,
  DriverLeaderboardSnapshot,
  Payment,
  Service,
} from "./database";

// ---------------------------------------------------------------
// Farmer Home
// ---------------------------------------------------------------
export interface ActiveBookingWithDriver extends Booking {
  drivers: Pick<Driver, "full_name" | "mobile_number"> | null;
}

// ---------------------------------------------------------------
// Farmer Booking Detail
// ---------------------------------------------------------------
export interface FarmerBookingDetail extends Booking {
  drivers: Pick<Driver, "full_name" | "mobile_number" | "rating"> | null;
}

export interface FarmerBookingDetailItem extends BookingItem {
  farms: Pick<Farm, "village" | "survey_number"> | null;
  services: Pick<Service, "name"> | null;
}

// ---------------------------------------------------------------
// Farmer Booking List / History
// ---------------------------------------------------------------
export interface FarmerBookingListItem extends Booking {
  drivers: Pick<Driver, "full_name"> | null;
}

// ---------------------------------------------------------------
// Farmer Chat (viewing the assigned driver's name)
// ---------------------------------------------------------------
export interface FarmerChatBookingRef {
  drivers: Pick<Driver, "full_name"> | null;
}

// ---------------------------------------------------------------
// Farmer Invoices
// ---------------------------------------------------------------
export interface InvoiceBookingItemRef {
  area_acre: BookingItem["area_acre"];
  final_amount: BookingItem["final_amount"];
  services: Pick<Service, "name"> | null;
}

export interface InvoiceBookingRef {
  booking_number: Booking["booking_number"];
  booking_items: InvoiceBookingItemRef[];
}

export interface PaymentWithInvoiceDetails extends Payment {
  bookings: InvoiceBookingRef | null;
}

// ---------------------------------------------------------------
// Driver Requests (nearby bookings list)
// ---------------------------------------------------------------
export interface DriverRequestBookingItemRef {
  area_acre: BookingItem["area_acre"];
  farms: Pick<Farm, "village"> | null;
  services: Pick<Service, "name"> | null;
}

export interface DriverRequestBookingRaw {
  id: Booking["id"];
  booking_number: Booking["booking_number"];
  booking_date: Booking["booking_date"];
  final_amount: Booking["final_amount"];
  notes: Booking["notes"];
  status: Booking["status"];
  farmers: Pick<Farmer, "village"> | null;
  booking_items: DriverRequestBookingItemRef[];
}

// ---------------------------------------------------------------
// Driver Jobs list
// ---------------------------------------------------------------
export interface DriverJobListItem extends Booking {
  farmers: Pick<Farmer, "village"> | null;
}

// ---------------------------------------------------------------
// Driver Job Detail
// ---------------------------------------------------------------
export interface DriverJobBookingDetail extends Booking {
  farmers: Pick<Farmer, "full_name" | "mobile_number" | "village" | "address"> | null;
}

export interface DriverJobBookingItem extends BookingItem {
  farms: Pick<Farm, "village" | "survey_number"> | null;
  services: Pick<Service, "name"> | null;
}

// ---------------------------------------------------------------
// Driver Chat (viewing the farmer's name)
// ---------------------------------------------------------------
export interface DriverChatBookingRef {
  farmers: Pick<Farmer, "full_name"> | null;
}

// ---------------------------------------------------------------
// Driver Earnings
// ---------------------------------------------------------------
export interface DriverEarningsBookingItem {
  id: Booking["id"];
  booking_number: Booking["booking_number"];
  final_amount: Booking["final_amount"];
  updated_at: Booking["updated_at"];
  farmers: Pick<Farmer, "village"> | null;
}

// ---------------------------------------------------------------
// Driver Leaderboard
// ---------------------------------------------------------------
export interface LeaderboardSnapshotWithDriver extends DriverLeaderboardSnapshot {
  drivers: Pick<Driver, "full_name" | "village"> | null;
}

// ---------------------------------------------------------------
// Admin Overview
// ---------------------------------------------------------------
export interface AdminRevenuePaymentRef {
  amount: Payment["amount"];
  subscription_id: Payment["subscription_id"];
  booking_id: Payment["booking_id"];
  bookings: { farmers: Pick<Farmer, "village"> | null } | null;
}

// ---------------------------------------------------------------
// Admin Bookings list
// ---------------------------------------------------------------
export interface AdminBookingListItem extends Booking {
  farmers: Pick<Farmer, "full_name" | "village"> | null;
  drivers: Pick<Driver, "full_name"> | null;
}

// ---------------------------------------------------------------
// Admin Farmers list
// ---------------------------------------------------------------
export interface AdminFarmerListItem extends Farmer {
  farms: { count: number }[];
}

export interface AdminFarmerBookingRef {
  id: Booking["id"];
  booking_number: Booking["booking_number"];
  status: Booking["status"];
  final_amount: Booking["final_amount"];
  booking_date: Booking["booking_date"];
}

// ---------------------------------------------------------------
// Admin Drivers detail
// ---------------------------------------------------------------
export interface AdminDriverJobRef {
  id: Booking["id"];
  booking_number: Booking["booking_number"];
  status: Booking["status"];
  final_amount: Booking["final_amount"];
  booking_date: Booking["booking_date"];
}

// ---------------------------------------------------------------
// Admin Analytics
// ---------------------------------------------------------------
export interface AnalyticsBookingItemRow {
  final_amount: BookingItem["final_amount"];
  services: Pick<Service, "name"> | null;
  farms: Pick<Farm, "village"> | null;
  bookings: { payment_status: Booking["payment_status"] };
}
