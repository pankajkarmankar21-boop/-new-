import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayInstance } from "@/lib/razorpay";

/**
 * Creates a Razorpay order. The amount is NEVER trusted from the client —
 * it is always re-fetched from the database (bookings.final_amount or
 * farmer_subscriptions.amount) using the authenticated user's own row,
 * which RLS guarantees belongs to them.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login आवश्यक आहे" }, { status: 401 });
  }

  const body = await req.json();
  const { type, id } = body as { type: "booking" | "subscription"; id: string };

  if (!type || !id) {
    return NextResponse.json({ error: "अपुरी माहिती" }, { status: 400 });
  }

  let amount: number;
  let receipt: string;

  if (type === "booking") {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, final_amount, farmer_id, booking_number, payment_status")
      .eq("id", id)
      .eq("farmer_id", user.id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "बुकिंग सापडली नाही" }, { status: 404 });
    }
    if (booking.payment_status === "success") {
      return NextResponse.json({ error: "आधीच पेमेंट झाले आहे" }, { status: 400 });
    }
    amount = booking.final_amount;
    receipt = booking.booking_number;
  } else {
    const { data: subscription, error } = await supabase
      .from("farmer_subscriptions")
      .select("id, amount, farmer_id, is_active")
      .eq("id", id)
      .eq("farmer_id", user.id)
      .single();

    if (error || !subscription) {
      return NextResponse.json({ error: "Subscription सापडले नाही" }, { status: 404 });
    }
    if (subscription.is_active) {
      return NextResponse.json({ error: "आधीच सक्रिय आहे" }, { status: 400 });
    }
    amount = subscription.amount;
    receipt = `SUB-${subscription.id.slice(0, 8)}`;
  }

  try {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt,
      notes: { type, referenceId: id, farmerId: user.id },
    });

    // Create a pending payment row to track this attempt
    await supabase.from("payments").insert({
      farmer_id: user.id,
      booking_id: type === "booking" ? id : null,
      subscription_id: type === "subscription" ? id : null,
      amount,
      method: "upi", // updated to actual method after verification
      status: "pending",
      razorpay_order_id: order.id,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Payment order तयार करता आले नाही" }, { status: 500 });
  }
}
