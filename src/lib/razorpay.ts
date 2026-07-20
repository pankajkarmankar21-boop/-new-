import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

/** Verifies the Razorpay payment signature after checkout completes */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return generated === signature;
}
