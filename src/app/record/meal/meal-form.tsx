"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveMeal } from "./actions";

const mealTypes = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "間食" },
] as const;

export function MealForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const result = await saveMeal(formData);
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
        <span className="text-sm font-medium">食事タイプ</span>
        <select
          name="mealType"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {mealTypes.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">内容</span>
        <textarea
          name="description"
          required
          rows={2}
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：ご飯、味噌汁、焼き魚"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">カロリー（kcal）</span>
          <input
            type="number"
            name="calories"
            min="0"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="500"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">タンパク質（g）</span>
          <input
            type="number"
            name="proteinGrams"
            min="0"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">脂質（g）</span>
          <input
            type="number"
            name="fatGrams"
            min="0"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="15"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">炭水化物（g）</span>
          <input
            type="number"
            name="carbGrams"
            min="0"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="60"
          />
        </label>
      </div>

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
