"use client";

import { useState } from "react";
import { CalorieRing } from "./calorie-ring";

type PfcItem = {
  label: string;
  fullLabel: string;
  current: number;
  target: number;
};

type Props = {
  intake: number;
  calorieTarget: number;
  exerciseCalories: number;
  pfcData: PfcItem[];
  currentWeight: number | null;
  targetWeight: number | null;
  currentBodyFat: number | null;
  targetBodyFat: number | null;
  hasGoal: boolean;
};

type Tab = "calorie" | "pfc" | "weight";

export function HomeTabs({
  intake,
  calorieTarget,
  exerciseCalories,
  pfcData,
  currentWeight,
  targetWeight,
  currentBodyFat,
  targetBodyFat,
  hasGoal,
}: Props) {
  const [tab, setTab] = useState<Tab>("calorie");

  const tabs: { key: Tab }[] = [
    { key: "calorie" },
    { key: "pfc" },
    { key: "weight" },
  ];

  return (
    <div className="mb-6">
      {/* タブインジケーター（横棒） */}
      <div className="flex gap-1.5 mb-4 px-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 h-1 rounded-full transition-colors ${
              tab === t.key
                ? "bg-zinc-900 dark:bg-white"
                : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        {tab === "calorie" && (
          <div>
            <h2 className="text-center text-sm font-medium mb-4">カロリー</h2>
            <div className="flex justify-center">
              <CalorieRing
                intake={intake}
                target={calorieTarget}
                exerciseCalories={exerciseCalories}
              />
            </div>
          </div>
        )}

        {tab === "pfc" && (
          <div>
            <h2 className="text-center text-sm font-medium mb-6">PFC</h2>
            {!hasGoal ? (
              <p className="text-sm text-zinc-400 text-center py-4">
                目標を設定すると表示されます
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {pfcData.map((pfc) => {
                  const remaining = Math.max(0, pfc.target - pfc.current);
                  return (
                    <div
                      key={pfc.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-zinc-500 w-20">
                        {pfc.fullLabel}
                      </span>
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">残り摂取</p>
                        <p className="text-2xl font-bold">
                          {remaining.toFixed(1)}{" "}
                          <span className="text-sm font-normal">g</span>
                        </p>
                        <p className="text-xs text-zinc-400">
                          {pfc.current} / {pfc.target} g
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "weight" && (
          <div>
            <h2 className="text-center text-sm font-medium mb-6">
              体重/体脂肪
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* 体重 */}
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-center">
                <p className="text-2xl font-bold">
                  {currentWeight ?? "---"}
                  <span className="text-sm font-normal"> kg</span>
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  目標値
                  <br />
                  <span className="font-medium">
                    {targetWeight ?? "---"} kg
                  </span>
                </p>
              </div>
              <div className="flex flex-col justify-center text-center">
                <p className="text-xs text-zinc-400">あと</p>
                <p className="text-2xl font-bold">
                  {currentWeight != null && targetWeight != null
                    ? (currentWeight - targetWeight).toFixed(1)
                    : "---"}
                  <span className="text-sm font-normal"> kg</span>
                </p>
              </div>

              {/* 体脂肪 */}
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-center">
                <p className="text-2xl font-bold">
                  {currentBodyFat ?? "---"}
                  <span className="text-sm font-normal"> %</span>
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  目標値
                  <br />
                  <span className="font-medium">
                    {targetBodyFat ?? "---"} %
                  </span>
                </p>
              </div>
              <div className="flex flex-col justify-center text-center">
                <p className="text-xs text-zinc-400">あと</p>
                <p className="text-2xl font-bold">
                  {currentBodyFat != null && targetBodyFat != null
                    ? (currentBodyFat - targetBodyFat).toFixed(1)
                    : "---"}
                  <span className="text-sm font-normal"> %</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
