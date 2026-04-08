"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveActivity } from "./actions";

const activityPresets = [
  { value: "walking", label: "ウォーキング", metPerMin: 3.5 },
  { value: "running", label: "ランニング", metPerMin: 8.0 },
  { value: "cycling", label: "自転車", metPerMin: 6.0 },
  { value: "swimming", label: "水泳", metPerMin: 7.0 },
  { value: "weight_training", label: "筋トレ", metPerMin: 5.0 },
  { value: "yoga", label: "ヨガ/ストレッチ", metPerMin: 2.5 },
  { value: "other", label: "その他", metPerMin: 4.0 },
] as const;

export function ActivityForm({ weightKg }: { weightKg: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activityType, setActivityType] = useState("walking");
  const [duration, setDuration] = useState("");

  const estimatedCalories = useMemo(() => {
    const preset = activityPresets.find((p) => p.value === activityType);
    const mins = Number(duration);
    if (!preset || !mins || mins <= 0) return null;
    return Math.round((preset.metPerMin * weightKg * mins) / 60);
  }, [activityType, duration, weightKg]);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const result = await saveActivity(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.refresh();
      setSaving(false);
      setDuration("");
    }
  }

  const selectedLabel =
    activityPresets.find((p) => p.value === activityType)?.label ?? activityType;

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">日付</span>
        <input
          type="date"
          name="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">活動内容</span>
        <div className="grid grid-cols-3 gap-2">
          {activityPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setActivityType(preset.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                activityType === preset.value
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="activityType" value={selectedLabel} />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">時間（分）</span>
        <input
          type="number"
          name="durationMinutes"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：30"
        />
      </label>

      {estimatedCalories !== null && (
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
          <p className="text-sm text-zinc-500">推定消費カロリー</p>
          <p className="text-xl font-bold mt-1">
            {estimatedCalories}
            <span className="text-sm font-normal">kcal</span>
          </p>
        </div>
      )}

      <input
        type="hidden"
        name="caloriesBurned"
        value={estimatedCalories ?? ""}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "保存中..." : "記録する"}
      </button>
    </form>
  );
}
