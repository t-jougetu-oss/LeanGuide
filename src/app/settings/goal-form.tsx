"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveGoal } from "./actions";
import { calcDailyCalorieTarget, calcPFC } from "@/lib/calc";
import { DateInput } from "../components/date-input";

type Goal = {
  targetWeightKg: string;
  targetDate: string;
  dailyCalorieTarget: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  carbGrams: number | null;
};

export function GoalForm({
  currentWeightKg,
  tdee,
  existingGoal,
}: {
  currentWeightKg: number;
  tdee: number;
  existingGoal: Goal;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [targetWeight, setTargetWeight] = useState(existingGoal.targetWeightKg);
  const [targetDate, setTargetDate] = useState(existingGoal.targetDate);

  const preview = useMemo(() => {
    const tw = Number(targetWeight);
    const days = Math.ceil(
      (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (!tw || days <= 0) return null;
    const cal = calcDailyCalorieTarget(tdee, currentWeightKg, tw, days);
    const pfc = calcPFC(cal, currentWeightKg);
    const weeklyLoss = ((currentWeightKg - tw) / days) * 7;
    return { cal, pfc, weeklyLoss };
  }, [targetWeight, targetDate, tdee, currentWeightKg]);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");

    const result = await saveGoal(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      setSaving(false);
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-4 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
      >
        目標を変更
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">目標体重（kg）</span>
          <input
            type="number"
            name="targetWeightKg"
            min="30"
            max="300"
            step="0.1"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">達成期限</span>
          <DateInput
            name="targetDate"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
        </div>
      </div>

      {preview && (
        <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
          <p>
            1日の目標: <strong>{preview.cal}kcal</strong>（P:{preview.pfc.protein}g / F:{preview.pfc.fat}g / C:{preview.pfc.carb}g）
          </p>
          <p className="text-zinc-500 mt-1">
            週あたり約{preview.weeklyLoss.toFixed(2)}kg減
          </p>
          {preview.weeklyLoss > 0.5 && (
            <p className="text-amber-600 mt-1">
              健康的なペースを超える可能性があります
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
