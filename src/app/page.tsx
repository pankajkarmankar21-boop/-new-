"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Tractor, Sprout, ShieldCheck, ChevronRight } from "lucide-react";

const roles = [
  {
    href: "/farmer/login",
    title: "शेतकरी",
    subtitle: "सेवा बुक करा, ७/१२ अपलोड करा",
    icon: Sprout,
    gradient: "from-primary-500 to-emerald-600",
  },
  {
    href: "/driver/login",
    title: "ड्रायव्हर",
    subtitle: "जवळपासच्या बुकिंग स्वीकारा",
    icon: Tractor,
    gradient: "from-earth-500 to-amber-600",
  },
  {
    href: "/admin/login",
    title: "ॲडमिन",
    subtitle: "संपूर्ण व्यवस्थापन",
    icon: ShieldCheck,
    gradient: "from-sky-500 to-blue-600",
  },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-hero px-6 py-12">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex flex-col items-center text-center"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-xl shadow-glass">
          <Tractor className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-4xl font-extrabold text-white drop-shadow-sm">किसान जुताई</h1>
        <p className="mt-2 max-w-xs text-sm font-medium text-white/80">
          तुमच्या शेतासाठी विश्वासार्ह ट्रॅक्टर सेवा — एका क्लिकवर
        </p>
      </motion.div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {roles.map((role, i) => {
          const Icon = role.icon;
          return (
            <motion.div
              key={role.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
            >
              <Link
                href={role.href}
                className="glass-card group flex items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-premium active:scale-[0.98]"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${role.gradient} shadow-lg`}
                >
                  <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-lg font-bold text-gray-900">{role.title}</h2>
                  <p className="text-sm text-gray-500">{role.subtitle}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-xs font-medium text-white/60"
      >
        © {new Date().getFullYear()} किसान जुताई · सर्व हक्क राखीव
      </motion.p>
    </main>
  );
}
