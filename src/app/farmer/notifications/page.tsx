"use client";

import { NotificationsList } from "@/components/NotificationsList";

export default function FarmerNotificationsPage() {
  return <NotificationsList backHref="/farmer/home" themeGradient="from-primary-600 to-emerald-600" />;
}
