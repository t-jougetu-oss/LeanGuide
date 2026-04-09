"use client";

export function CalorieRing({
  intake,
  target,
  exerciseCalories,
}: {
  intake: number;
  target: number;
  exerciseCalories: number;
}) {
  const remaining = Math.max(0, target - intake + exerciseCalories);
  const percent = target > 0 ? Math.min((intake / target) * 100, 100) : 0;

  // SVG circle params
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const ringColor =
    intake > target
      ? "#ef4444" // red - over
      : percent >= 80
        ? "#f59e0b" // amber - close
        : "#22c55e"; // green - good

  return (
    <div className="flex items-center gap-6">
      {/* リング */}
      <div className="relative shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          {/* 背景リング */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-100 dark:text-zinc-800"
          />
          {/* プログレスリング */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        {/* 中央テキスト */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{remaining}</span>
          <span className="text-[10px] text-zinc-400">kcal</span>
          <span className="text-[10px] text-zinc-400">残り摂取</span>
        </div>
      </div>

      {/* 右側の数値 */}
      <div className="flex flex-col gap-3 text-sm">
        <div>
          <p className="text-zinc-500">摂取カロリー</p>
          <p className="font-bold">
            {intake} <span className="text-xs font-normal">kcal</span>
          </p>
        </div>
        <div>
          <p className="text-zinc-500">目標値</p>
          <p className="font-bold">
            {target} <span className="text-xs font-normal">kcal</span>
          </p>
        </div>
        <div>
          <p className="text-zinc-500">運動消費カロリー</p>
          <p className="font-bold">
            {exerciseCalories} <span className="text-xs font-normal">kcal</span>
          </p>
        </div>
      </div>
    </div>
  );
}
