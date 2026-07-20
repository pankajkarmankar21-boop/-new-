"use client";

import { NotificationsList } from "@/components/NotificationsList";
import { DriverBottomNav } from "@/components/DriverBottomNav";

export default function DriverNotificationsPage() {
  return (
    <>
      <NotificationsList backHref="/driver/requests" themeGradient="from-earth-600 to-amber-600" />
      <DriverBottomNav active="notifications" />
    </>
  );
}
