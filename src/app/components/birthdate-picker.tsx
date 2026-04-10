"use client";

import { useCallback, useEffect, useRef } from "react";

const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 5; // 上下2行ずつ + 中央1行
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT; // 200px
const PADDING = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 80px

interface WheelColumnProps {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  ariaLabel: string;
}

function WheelColumn({
  items,
  value,
  onChange,
  format,
  ariaLabel,
}: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number | null>(null);
  const lastReportedValue = useRef<number>(value);

  // 外部から value が変わったらスクロール位置を同期
  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(value);
    if (idx < 0) return;
    const targetScroll = idx * ITEM_HEIGHT;
    if (Math.round(ref.current.scrollTop / ITEM_HEIGHT) !== idx) {
      ref.current.scrollTop = targetScroll;
      lastReportedValue.current = value;
    }
  }, [value, items]);

  const handleScroll = useCallback(() => {
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const newValue = items[clamped];
      if (newValue !== lastReportedValue.current) {
        lastReportedValue.current = newValue;
        onChange(newValue);
      }
    }, 100);
  }, [items, onChange]);

  function handleItemClick(item: number) {
    if (!ref.current) return;
    const idx = items.indexOf(item);
    if (idx < 0) return;
    ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto wheel-scroll"
      style={{
        height: CONTAINER_HEIGHT,
        scrollSnapType: "y mandatory",
      }}
      role="listbox"
      aria-label={ariaLabel}
    >
      <div style={{ height: PADDING }} aria-hidden />
      {items.map((item) => {
        const isSelected = item === value;
        return (
          <div
            key={item}
            onClick={() => handleItemClick(item)}
            className={`flex items-center justify-center select-none cursor-pointer transition-colors ${
              isSelected
                ? "text-orange-600 font-bold text-lg"
                : "text-zinc-400 text-base"
            }`}
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: "center",
              scrollSnapStop: "always",
            }}
            role="option"
            aria-selected={isSelected}
          >
            {format(item)}
          </div>
        );
      })}
      <div style={{ height: PADDING }} aria-hidden />
    </div>
  );
}

interface Props {
  name: string;
  value: string; // "YYYY-MM-DD" 形式または空文字
  onChange: (value: string) => void;
  required?: boolean;
}

const currentYear = new Date().getFullYear();

// 10歳〜100歳の範囲（昇順 = スクロール下方向に新しい年）
const years: number[] = [];
for (let y = currentYear - 100; y <= currentYear - 10; y++) years.push(y);

const months = Array.from({ length: 12 }, (_, i) => i + 1);

// 初期値（未入力時のデフォルト位置）
const DEFAULT_YEAR = 1980;
const DEFAULT_MONTH = 1;
const DEFAULT_DAY = 1;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function BirthDatePicker({ name, value, onChange, required }: Props) {
  // value 文字列をパース
  const parts = value ? value.split("-") : [];
  const year = parts[0] ? Number(parts[0]) : DEFAULT_YEAR;
  const month = parts[1] ? Number(parts[1]) : DEFAULT_MONTH;
  const day = parts[2] ? Number(parts[2]) : DEFAULT_DAY;

  // マウント時に value が空ならデフォルト値で初期化
  useEffect(() => {
    if (!value) {
      onChange(`${DEFAULT_YEAR}-${pad(DEFAULT_MONTH)}-${pad(DEFAULT_DAY)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 年・月から月末日を計算（うるう年対応）
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function update(y: number, m: number, d: number) {
    // 月末日を超えたらクランプ
    const maxDays = new Date(y, m, 0).getDate();
    const clampedDay = d > maxDays ? maxDays : d;
    onChange(`${y}-${pad(m)}-${pad(clampedDay)}`);
  }

  return (
    <div className="relative rounded-xl border border-orange-300 bg-white overflow-hidden">
      {/* 中央の選択ハイライト */}
      <div
        className="pointer-events-none absolute left-0 right-0 border-y border-orange-400 bg-orange-50"
        style={{
          top: PADDING,
          height: ITEM_HEIGHT,
        }}
        aria-hidden
      />
      <div className="relative flex">
        <WheelColumn
          items={years}
          value={year}
          onChange={(v) => update(v, month, day)}
          format={(v) => `${v}年`}
          ariaLabel="年"
        />
        <WheelColumn
          items={months}
          value={month}
          onChange={(v) => update(year, v, day)}
          format={(v) => `${v}月`}
          ariaLabel="月"
        />
        <WheelColumn
          items={days}
          value={day}
          onChange={(v) => update(year, month, v)}
          format={(v) => `${v}日`}
          ariaLabel="日"
        />
      </div>
      <input type="hidden" name={name} value={value} required={required} />
      {/* スクロールバー非表示 */}
      <style>{`
        .wheel-scroll::-webkit-scrollbar { display: none; }
        .wheel-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}
