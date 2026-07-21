"use client";

import Link from "next/link";
import { LayoutDashboard, Tractor as TractorIcon, Users, BarChart3, Bell } from "lucide-react";

const items = [
  { key: "overview", href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { key: "farmers", href: "/admin/farmers", label: "शेतकरी", icon: Users },
  { key: "drivers", href: "/admin/drivers", label: "ड्रायव्हर", icon: TractorIcon },
  { key: "analytics", href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { key: "broadcast", href: "/admin/broadcast", label: "सूचना", icon: Bell },
] as const;

export function AdminBottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link key={item.key} href={item.href} className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition ${isActive ? "text-sky-600" : "text-gray-400"}`}>
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
