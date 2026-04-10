"use client";

import { useState, useMemo } from "react";

type WeightPoint = {
  date: string;
  weight: number;
  bodyFatPercent: number | null;
};

type MealPoint = {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carb: number;
};

// 選択可能な4グループ（PFCは1グループ扱い）
type Group = "PFC" | "kcal" | "kg" | "%";

type Metric = "P" | "F" | "C" | "kcal" | "kg" | "%";

const metricColors: Record<Metric, string> = {
  P: "#ef4444",
  F: "#f59e0b",
  C: "#22c55e",
  kcal: "#f97316",
  kg: "#3b82f6",
  "%": "#8b5cf6",
};

const MAX_SELECTIONS = 2;

type Series = {
  metric: Metric;
  data: { date: string; value: number }[];
};

export function GraphView({
  weightData,
  mealData,
  defaultStartDate,
  defaultEndDate,
}: {
  weightData: WeightPoint[];
  mealData: MealPoint[];
  defaultStartDate: string;
  defaultEndDate: string;
}) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [activeGroups, setActiveGroups] = useState<Set<Group>>(
    new Set(["PFC", "kcal"])
  );

  function toggleGroup(g: Group) {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) {
        next.delete(g);
      } else {
        if (next.size >= MAX_SELECTIONS) {
          // 最大2つ → 最も古い選択を外して新しいのを追加
          const first = next.values().next().value;
          next.delete(first!);
        }
        next.add(g);
      }
      return next;
    });
  }

  // アクティブなメトリック一覧
  const activeMetrics = useMemo(() => {
    const metrics: Metric[] = [];
    if (activeGroups.has("PFC")) metrics.push("P", "F", "C");
    if (activeGroups.has("kcal")) metrics.push("kcal");
    if (activeGroups.has("kg")) metrics.push("kg");
    if (activeGroups.has("%")) metrics.push("%");
    return metrics;
  }, [activeGroups]);

  // 各メトリックのデータ系列を生成
  const seriesList = useMemo(() => {
    const result: Series[] = [];
    const filterDate = (d: { date: string }) =>
      d.date >= startDate && d.date <= endDate;

    if (activeMetrics.includes("P")) {
      result.push({
        metric: "P",
        data: mealData.filter(filterDate).map((d) => ({ date: d.date, value: d.protein })),
      });
    }
    if (activeMetrics.includes("F")) {
      result.push({
        metric: "F",
        data: mealData.filter(filterDate).map((d) => ({ date: d.date, value: d.fat })),
      });
    }
    if (activeMetrics.includes("C")) {
      result.push({
        metric: "C",
        data: mealData.filter(filterDate).map((d) => ({ date: d.date, value: d.carb })),
      });
    }
    if (activeMetrics.includes("kcal")) {
      result.push({
        metric: "kcal",
        data: mealData.filter(filterDate).map((d) => ({ date: d.date, value: d.calories })),
      });
    }
    if (activeMetrics.includes("kg")) {
      result.push({
        metric: "kg",
        data: weightData.filter(filterDate).map((d) => ({ date: d.date, value: d.weight })),
      });
    }
    if (activeMetrics.includes("%")) {
      result.push({
        metric: "%",
        data: weightData
          .filter((d) => filterDate(d) && d.bodyFatPercent !== null)
          .map((d) => ({ date: d.date, value: d.bodyFatPercent! })),
      });
    }
    return result;
  }, [activeMetrics, startDate, endDate, weightData, mealData]);

  const hasData = seriesList.some((s) => s.data.length > 0);

  // 全系列の全日付を収集してソート
  const allDates = useMemo(() => {
    const dateSet = new Set<string>();
    seriesList.forEach((s) => s.data.forEach((d) => dateSet.add(d.date)));
    return Array.from(dateSet).sort();
  }, [seriesList]);

  // SVG chart
  const width = 320;
  const height = 160;
  const padX = 8;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const allValues = seriesList.flatMap((s) => s.data.map((d) => d.value));
  const minV = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxV = allValues.length > 0 ? Math.max(...allValues) : 1;
  const range = maxV - minV || 1;

  function xPos(date: string) {
    const idx = allDates.indexOf(date);
    if (allDates.length <= 1) return padX + chartW / 2;
    return padX + (idx / (allDates.length - 1)) * chartW;
  }
  function yPos(v: number) {
    return padY + (1 - (v - (minV - range * 0.1)) / (range * 1.2)) * chartH;
  }

  function buildPath(data: { date: string; value: number }[]) {
    if (data.length < 2) return "";
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"}${xPos(d.date)},${yPos(d.value)}`)
      .join(" ");
  }

  // ボタン表示用データ
  const buttons: { group: Group; label: string; metrics: Metric[] }[] = [
    { group: "PFC", label: "P", metrics: ["P"] },
    { group: "PFC", label: "F", metrics: ["F"] },
    { group: "PFC", label: "C", metrics: ["C"] },
    { group: "kcal", label: "kcal", metrics: ["kcal"] },
    { group: "kg", label: "kg", metrics: ["kg"] },
    { group: "%", label: "%", metrics: ["%"] },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 期間選択 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">&#128197;</span>
          <span className="text-sm font-medium text-zinc-500">
            グラフデータ表示期間
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 rounded-lg border border-orange-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span className="text-zinc-400">&mdash;</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 rounded-lg border border-orange-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* グラフ */}
      <div className="rounded-xl border border-orange-200 p-4 dark:border-zinc-800">
        {!hasData || activeGroups.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3 text-zinc-300">&#128200;</div>
            <p className="text-sm font-medium text-zinc-500 mb-2">
              グラフデータがありません
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              選択したグラフ表示期間内に対象のデータが存在し
              <br />
              ないか、もしくはデータが選択されていません。
              <br />
              期間の変更をするか、グラフに表示するデータを選択
              <br />
              して下さい。
            </p>
          </div>
        ) : (
          <div>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto"
              aria-label="グラフ"
            >
              {/* グリッドライン */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const yLine = padY + ratio * chartH;
                return (
                  <line
                    key={ratio}
                    x1={padX}
                    y1={yLine}
                    x2={width - padX}
                    y2={yLine}
                    stroke="currentColor"
                    className="text-zinc-100 dark:text-zinc-800"
                    strokeWidth="0.5"
                  />
                );
              })}

              {/* 各系列のライン */}
              {seriesList.map((series) => {
                const path = buildPath(series.data);
                if (!path) return null;
                return (
                  <g key={series.metric}>
                    <path
                      d={path}
                      fill="none"
                      stroke={metricColors[series.metric]}
                      strokeWidth="2"
                    />
                    {series.data.map((d, i) => (
                      <circle
                        key={i}
                        cx={xPos(d.date)}
                        cy={yPos(d.value)}
                        r="2.5"
                        fill={metricColors[series.metric]}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

            {/* 日付ラベル */}
            {allDates.length > 0 && (
              <div className="flex justify-between mt-1 text-xs text-zinc-400">
                <span>{allDates[0].slice(5)}</span>
                <span>{allDates[allDates.length - 1].slice(5)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* メトリック選択ボタン（最大2グループ、PFCは連動） */}
      <div className="flex gap-2 justify-center">
        {buttons.map((btn) => {
          const isActive = activeGroups.has(btn.group);
          const color = metricColors[btn.metrics[0]];
          return (
            <button
              key={btn.label}
              onClick={() => toggleGroup(btn.group)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "text-white"
                  : "border border-orange-300 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
              style={isActive ? { backgroundColor: color } : undefined}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
