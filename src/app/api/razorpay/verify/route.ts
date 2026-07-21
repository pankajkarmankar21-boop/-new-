import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login आवश्यक आहे" }, { status: 401 });
  }

  const body = await req.json();
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    method,
  }: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    method: "upi" | "card" | "netbanking" | "wallet";
  } = body;

  const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) {
    return NextResponse.json({ error: "Payment पडताळणी अयशस्वी" }, { status: 400 });
  }

  // Admin client used here because we need to update related rows (booking/subscription)
  // that this transaction touches beyond the payments row itself.
  const admin = createAdminClient();

  const { data: payment, error: paymentFetchError } = await admin
    .from("payments")
    .select("*")
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("farmer_id", user.id)
    .single();

  if (paymentFetchError || !payment) {
    return NextResponse.json({ error: "Payment record सापडला नाही" }, { status: 404 });
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const { error: updatePaymentError } = await admin
    .from("payments")
    .update({
      status: "success",
      method,
      razorpay_payment_id,
      razorpay_signature,
      invoice_number: invoiceNumber,
    })
    .eq("id", payment.id);

  if (updatePaymentError) {
    return NextResponse.json({ error: "Payment update अयशस्वी" }, { status: 500 });
  }

  if (payment.booking_id) {
    await admin
      .from("bookings")
      .update({ payment_status: "success" })
      .eq("id", payment.booking_id);

    // Trigger nearby-driver notification now that payment is confirmed
    await admin.rpc("notify_nearby_drivers", { p_booking_id: payment.booking_id }).select();
  }

  if (payment.subscription_id) {
    await admin
      .from("farmer_subscriptions")
      .update({ is_active: true, payment_id: payment.id })
      .eq("id", payment.subscription_id);
  }

  return NextResponse.json({ success: true, invoiceNumber, paymentId: payment.id });
}
