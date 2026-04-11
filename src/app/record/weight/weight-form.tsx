"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveWeight } from "./actions";
import { DateInput } from "../../components/date-input";
import { jstToday } from "@/lib/date";

export function WeightForm({ defaultDate }: { defaultDate?: string } = {}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const result = await saveWeight(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.refresh();
      setSaving(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">日付</span>
        <DateInput
          name="date"
          defaultValue={defaultDate ?? jstToday()}
          required
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">体重（kg）</span>
        <input
          type="number"
          name="weightKg"
          min="30"
          max="300"
          step="0.1"
          required
          className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：65.0"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">体脂肪率（%）</span>
        <input
          type="number"
          name="bodyFatPercent"
          min="1"
          max="60"
          step="0.1"
          className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：17.6"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "保存中..." : "記録する"}
      </button>
    </form>
  );
}
