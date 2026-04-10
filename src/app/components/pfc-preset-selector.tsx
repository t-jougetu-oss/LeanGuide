"use client";

import { useState, useCallback } from "react";

const presets = [
  { label: "減量（標準）", p: 30, f: 25, c: 45 },
  { label: "減量（高タンパク）", p: 40, f: 20, c: 40 },
  { label: "増量・筋力UP", p: 25, f: 25, c: 50 },
  { label: "維持", p: 20, f: 25, c: 55 },
] as const;

type Props = {
  defaultP?: number;
  defaultF?: number;
  defaultC?: number;
};

export function PfcPresetSelector({ defaultP = 25, defaultF = 25, defaultC = 50 }: Props) {
  const [p, setP] = useState(defaultP);
  const [f, setF] = useState(defaultF);
  const [c, setC] = useState(defaultC);

  const activePreset = presets.findIndex(
    (preset) => preset.p === p && preset.f === f && preset.c === c
  );

  const applyPreset = useCallback((preset: (typeof presets)[number]) => {
    setP(preset.p);
    setF(preset.f);
    setC(preset.c);
  }, []);

  // スライダー変更時、合計100%を維持（残りを他の2つに按分）
  const handleSliderChange = useCallback(
    (which: "p" | "f" | "c", value: number) => {
      const clamped = Math.min(80, Math.max(5, value));
      if (which === "p") {
        const remaining = 100 - clamped;
        const ratio = f + c > 0 ? f / (f + c) : 0.5;
        const newF = Math.round(remaining * ratio);
        const newC = remaining - newF;
        setP(clamped);
        setF(Math.max(5, newF));
        setC(Math.max(5, newC));
        // 端数調整
        const total = clamped + Math.max(5, newF) + Math.max(5, newC);
        if (total !== 100) setC(100 - clamped - Math.max(5, newF));
      } else if (which === "f") {
        const remaining = 100 - clamped;
        const ratio = p + c > 0 ? p / (p + c) : 0.5;
        const newP = Math.round(remaining * ratio);
        const newC = remaining - newP;
        setF(clamped);
        setP(Math.max(5, newP));
        setC(Math.max(5, newC));
        const total = Math.max(5, newP) + clamped + Math.max(5, newC);
        if (total !== 100) setC(100 - Math.max(5, newP) - clamped);
      } else {
        const remaining = 100 - clamped;
        const ratio = p + f > 0 ? p / (p + f) : 0.5;
        const newP = Math.round(remaining * ratio);
        const newF = remaining - newP;
        setC(clamped);
        setP(Math.max(5, newP));
        setF(Math.max(5, newF));
        const total = Math.max(5, newP) + Math.max(5, newF) + clamped;
        if (total !== 100) setF(100 - Math.max(5, newP) - clamped);
      }
    },
    [p, f, c]
  );

  const total = p + f + c;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">PFCバランス目安</span>
      <p className="text-xs text-zinc-500 -mt-2">
        目的に合わせた栄養バランスを選んでください
      </p>

      {/* プリセットボタン */}
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset, i) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className={`rounded-xl border px-3 py-2.5 text-center transition-colors ${
              activePreset === i
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-orange-300 hover:bg-zinc-50"
            }`}
          >
            <span className="text-xs font-semibold block">{preset.label}</span>
            <span className="text-[10px] opacity-70 block mt-0.5">
              P:{preset.p} F:{preset.f} C:{preset.c}
            </span>
          </button>
        ))}
      </div>

      {/* スライダー */}
      <div className="flex flex-col gap-2 mt-1">
        <SliderRow
          label="P（タンパク質）"
          color="#3b82f6"
          value={p}
          onChange={(v) => handleSliderChange("p", v)}
        />
        <SliderRow
          label="F（脂質）"
          color="#f59e0b"
          value={f}
          onChange={(v) => handleSliderChange("f", v)}
        />
        <SliderRow
          label="C（炭水化物）"
          color="#10b981"
          value={c}
          onChange={(v) => handleSliderChange("c", v)}
        />
      </div>

      {/* 合計バー */}
      <div className="flex h-2 rounded-full overflow-hidden">
        <div className="bg-blue-500 transition-all" style={{ width: `${p}%` }} />
        <div className="bg-amber-400 transition-all" style={{ width: `${f}%` }} />
        <div className="bg-emerald-500 transition-all" style={{ width: `${c}%` }} />
      </div>
      <p className={`text-[11px] text-right ${total !== 100 ? "text-red-500 font-bold" : "text-zinc-400"}`}>
        合計: {total}%
      </p>

      {/* hidden inputs for form submission */}
      <input type="hidden" name="proteinPercent" value={p} />
      <input type="hidden" name="fatPercent" value={f} />
      <input type="hidden" name="carbPercent" value={c} />
    </div>
  );
}

function SliderRow({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
        <span className="text-xs font-bold">{value}%</span>
      </div>
      <input
        type="range"
        min={5}
        max={80}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-zinc-200"
        style={{
          accentColor: color,
        }}
      />
    </div>
  );
}
