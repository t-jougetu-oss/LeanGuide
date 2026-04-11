"use client";

import { useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { jstDaysAgo, jstToday } from "@/lib/date";

// 記録ページ共通の日付ストリップ。
// 選択日は URL クエリパラメータ `?date=YYYY-MM-DD` で管理する。
// date が指定されていなければ今日扱い。
export function RecordDateNav({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = jstToday();

  // 直近14日間 + 今日を生成（JST基準）
  const dates: { date: string; label: string; isToday: boolean }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dateStr = jstDaysAgo(i);
    const [, m, day] = dateStr.split("-").map(Number);
    const isToday = i === 0;
    const label = isToday ? `Today ${m}/${day}` : `${m}/${day}`;
    dates.push({ date: dateStr, label, isToday });
  }

  function handleSelect(date: string) {
    // 今日を選択した場合は ?date を消してクリーンなURLに
    if (date === today) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?date=${date}`);
    }
  }

  // 選択日に合わせてスクロール位置を調整
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(
        "[data-active='true']"
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          inline: "center",
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedDate]);

  return (
    <div className="flex items-center gap-2 mb-4 p-2 rounded-xl bg-orange-50 border border-orange-200 dark:bg-zinc-900 dark:border-zinc-800">
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
              onClick={() => handleSelect(d.date)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
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
    </div>
  );
}
