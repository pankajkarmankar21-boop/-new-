import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateMarathi(dateStr: string): string {
  const months = [
    "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
    "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर",
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Validates a 10-digit Indian mobile number */
export function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

/** Generates a 6-digit numeric OTP for job-completion verification */
export function generateCompletionOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Calculates subscription price: ₹550 per acre per year */
export function calculateSubscriptionAmount(totalAcre: number, pricePerAcre = 550): number {
  return Math.round(totalAcre * pricePerAcre);
}

/** Applies 50% subscriber discount to a service amount */
export function applySubscriberDiscount(amount: number, isSubscriber: boolean): number {
  return isSubscriber ? Math.round(amount * 0.5) : amount;
}
