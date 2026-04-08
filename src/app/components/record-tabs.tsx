"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/record/meal", label: "食事" },
  { href: "/record/weight", label: "体重" },
  { href: "/record/activity", label: "活動" },
];

export function RecordTabs() {
  const pathname = usePathname();

  return (
    <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
