"use client";

import { useCallback } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface PayOptions {
  type: "booking" | "subscription";
  id: string;
  farmerName: string;
  farmerMobile: string;
  onSuccess: (invoiceNumber: string) => void;
  onFailure?: () => void;
}

export function useRazorpayCheckout() {
  const pay = useCallback(async (opts: PayOptions) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error("Payment system लोड करता आले नाही. Internet तपासा.");
      return;
    }

    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: opts.type, id: opts.id }),
    });
    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      toast.error(orderData.error || "Payment सुरू करता आले नाही");
      opts.onFailure?.();
      return;
    }

    const razorpay = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: "किसान जुताई",
      description: opts.type === "booking" ? "सेवा बुकिंग पेमेंट" : "वार्षिक सदस्यता",
      prefill: {
        name: opts.farmerName,
        contact: opts.farmerMobile,
      },
      theme: { color: "#16a34a" },
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
      },
      handler: async function (response: any) {
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            method: "upi",
          }),
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.ok) {
          toast.success("पेमेंट यशस्वी!");
          opts.onSuccess(verifyData.invoiceNumber);
        } else {
          toast.error(verifyData.error || "पेमेंट पडताळणी अयशस्वी");
          opts.onFailure?.();
        }
      },
      modal: {
        ondismiss: function () {
          toast.info("पेमेंट रद्द केले");
          opts.onFailure?.();
        },
      },
    });

    razorpay.on("payment.failed", function () {
      toast.error("पेमेंट अयशस्वी झाले. पुन्हा प्रयत्न करा.");
      opts.onFailure?.();
    });

    razorpay.open();
  }, []);

  return { pay };
}
