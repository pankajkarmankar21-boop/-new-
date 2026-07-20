"use client";

import Link from "next/link";
import { Layers, Briefcase, Wallet, Bell, User } from "lucide-react";

const items = [
  { key: "requests", href: "/driver/requests", label: "नवीन", icon: Layers },
  { key: "jobs", href: "/driver/jobs", label: "माझी कामे", icon: Briefcase },
  { key: "earnings", href: "/driver/earnings", label: "कमाई", icon: Wallet },
  { key: "notifications", href: "/driver/notifications", label: "सूचना", icon: Bell },
  { key: "profile", href: "/driver/profile", label: "प्रोफाईल", icon: User },
] as const;

export function DriverBottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition ${isActive ? "text-earth-600" : "text-gray-400"}`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
