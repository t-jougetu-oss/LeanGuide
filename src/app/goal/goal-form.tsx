"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveGoal } from "./actions";
import { calcDailyCalorieTarget, calcPFC } from "@/lib/calc";

type ExistingGoal = {
  targetWeightKg: string;
  targetDate: string;
  dailyCalorieTarget: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  carbGrams: number | null;
} | null;

export function GoalForm({
  currentWeightKg,
  tdee,
  existingGoal,
}: {
  currentWeightKg: number;
  tdee: number;
  existingGoal: ExistingGoal;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{
    calories: number;
    protein: number;
    fat: number;
    carb: number;
  } | null>(null);

  function handlePreview(formData: FormData) {
    const targetWeight = Number(formData.get("targetWeightKg"));
    const targetDate = formData.get("targetDate") as string;

    if (!targetWeight || !targetDate) return;

    const daysToGoal = Math.ceil(
      (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysToGoal <= 0) {
      setPreview(null);
      return;
    }

    const calories = calcDailyCalorieTarget(
      tdee,
      currentWeightKg,
      targetWeight,
      daysToGoal
    );
    const pfc = calcPFC(calories, currentWeightKg);
    setPreview({ calories, ...pfc });
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");

    const result = await saveGoal(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push("/");
    }
  }

  return (
    <form
      action={handleSubmit}
      onChange={(e) => {
        const form = e.currentTarget;
        handlePreview(new FormData(form));
      }}
      className="flex flex-col gap-5"
    >
      {/* 目標体重 */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">目標体重（kg）</span>
        <input
          type="number"
          name="targetWeightKg"
          min="30"
          max="300"
          step="0.1"
          defaultValue={existingGoal?.targetWeightKg ?? ""}
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：60.0"
        />
      </label>

      {/* 達成期限 */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">達成期限</span>
        <input
          type="date"
          name="targetDate"
          defaultValue={existingGoal?.targetDate ?? ""}
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {/* プレビュー */}
      {preview && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium mb-3">自動算出結果</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-zinc-500">1日の目標カロリー</span>
              <p className="text-lg font-bold">{preview.calories}kcal</p>
            </div>
            <div>
              <span className="text-zinc-500">タンパク質</span>
              <p className="text-lg font-bold">{preview.protein}g</p>
            </div>
            <div>
              <span className="text-zinc-500">脂質</span>
              <p className="text-lg font-bold">{preview.fat}g</p>
            </div>
            <div>
              <span className="text-zinc-500">炭水化物</span>
              <p className="text-lg font-bold">{preview.carb}g</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "保存中..." : "目標を保存する"}
      </button>
    </form>
  );
}
