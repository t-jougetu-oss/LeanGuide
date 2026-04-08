"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveActivity } from "./actions";

export function ActivityForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const result = await saveActivity(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push("/dashboard");
    }
  }

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

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">活動内容</span>
        <input
          type="text"
          name="activityType"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：ウォーキング、筋トレ、ランニング"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">時間（分）</span>
        <input
          type="number"
          name="durationMinutes"
          min="1"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：30"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">消費カロリー（kcal・任意）</span>
        <input
          type="number"
          name="caloriesBurned"
          min="0"
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：200"
        />
      </label>

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
