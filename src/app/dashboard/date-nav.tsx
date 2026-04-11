"use client";

import { useRef, useEffect } from "react";
import { jstDaysAgo, jstToday } from "@/lib/date";

export function DateNav({
  selectedDate,
  onDateChange,
}: {
  selectedDate: string;
  onDateChange: (date: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 直近14日間 + 今日を生成（JST基準）
  const dates: { date: string; label: string; isToday: boolean }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dateStr = jstDaysAgo(i);
    const [, m, day] = dateStr.split("-").map(Number);
    const isToday = i === 0;
    const label = isToday ? "Today" : `${m}/${day}`;
    dates.push({ date: dateStr, label, isToday });
  }

  // 年表示（JST）
  const year = Number(jstToday().split("-")[0]);

  // 選択日が変わったらスクロール位置を調整
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector("[data-active='true']");
      if (activeEl) {
        activeEl.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedDate]);

  return (
    <div className="flex items-center gap-2 mb-6">
      <div
        ref={scrollRef}
        className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {dates.map((d) => {
          const isSelected = d.date === selectedDate;
          return (
            <button
              key={d.date}
              data-active={isSelected}
              onClick={() => onDateChange(d.date)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-amber-600 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <span className="shrink-0 text-xs text-zinc-400 font-medium">{year}</span>
    </div>
  );
}
