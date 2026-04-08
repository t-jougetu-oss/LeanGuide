"use client";

type DataPoint = { date: string; weight: number };

function calcMovingAverage(data: DataPoint[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null;
    const slice = data.slice(i - window + 1, i + 1);
    return slice.reduce((sum, d) => sum + d.weight, 0) / slice.length;
  });
}

export function WeightMiniChart({
  data,
  targetWeight,
}: {
  data: DataPoint[];
  targetWeight?: number;
}) {
  if (data.length < 2) return null;

  const movingAvg = calcMovingAverage(data, 7);
  const weights = data.map((d) => d.weight);
  const allValues = [
    ...weights,
    ...movingAvg.filter((v): v is number => v !== null),
    ...(targetWeight !== undefined ? [targetWeight] : []),
  ];
  const minW = Math.min(...allValues) - 0.5;
  const maxW = Math.max(...allValues) + 0.5;
  const range = maxW - minW || 1;

  const width = 320;
  const height = 120;
  const padX = 0;
  const padY = 8;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  function x(i: number) {
    return padX + (i / (data.length - 1)) * chartW;
  }
  function y(w: number) {
    return padY + (1 - (w - minW) / range) * chartH;
  }

  // 実測値の折れ線
  const actualPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.weight)}`)
    .join(" ");

  // 移動平均の折れ線
  const maPoints = movingAvg
    .map((v, i) => (v !== null ? { x: x(i), y: y(v) } : null))
    .filter((p): p is { x: number; y: number } => p !== null);
  const maPath = maPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        aria-label="体重推移グラフ"
      >
        {/* 目標体重ライン */}
        {targetWeight !== undefined && (
          <>
            <line
              x1={padX}
              y1={y(targetWeight)}
              x2={width - padX}
              y2={y(targetWeight)}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-green-400"
              strokeWidth="1"
            />
            <text
              x={width - padX}
              y={y(targetWeight) - 4}
              textAnchor="end"
              className="fill-green-500 text-[8px]"
            >
              目標 {targetWeight}kg
            </text>
          </>
        )}

        {/* 実測値 */}
        <path
          d={actualPath}
          fill="none"
          stroke="currentColor"
          className="text-zinc-300 dark:text-zinc-600"
          strokeWidth="1.5"
        />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.weight)}
            r="2.5"
            className="fill-zinc-400 dark:fill-zinc-500"
          />
        ))}

        {/* 7日間移動平均 */}
        {maPath && (
          <path
            d={maPath}
            fill="none"
            stroke="currentColor"
            className="text-blue-500"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-zinc-400 rounded" />
          実測値
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-blue-500 rounded" />
          7日間移動平均
        </div>
        {targetWeight !== undefined && (
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 border-t border-dashed border-green-400" />
            目標
          </div>
        )}
      </div>

      {/* 直近の値 */}
      <div className="flex justify-between mt-2 text-xs text-zinc-400">
        <span>{data[0].date.slice(5)}</span>
        <span>{data[data.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}
