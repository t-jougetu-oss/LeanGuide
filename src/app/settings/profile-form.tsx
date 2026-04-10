"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "./actions";
import { PfcPresetSelector } from "../components/pfc-preset-selector";

type Profile = {
  gender: "male" | "female";
  age: number;
  heightCm: string;
  weightKg: string;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  proteinPercent: number | null;
  fatPercent: number | null;
  carbPercent: number | null;
};

const activityLabels = {
  sedentary: "ほぼ運動しない",
  light: "軽い運動（週1〜3回）",
  moderate: "中程度の運動（週3〜5回）",
  active: "激しい運動（週6〜7回）",
  very_active: "非常に激しい運動",
} as const;

export function ProfileForm({ existingProfile }: { existingProfile: Profile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");

    const result = await saveProfile(formData);
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
        プロフィールを編集
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 flex flex-col gap-4 border-t border-orange-200 pt-4 dark:border-zinc-700">
      <fieldset>
        <legend className="text-sm font-medium mb-2">性別</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="gender"
              value="male"
              defaultChecked={existingProfile.gender === "male"}
              required
            />
            男性
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="gender"
              value="female"
              defaultChecked={existingProfile.gender === "female"}
            />
            女性
          </label>
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">年齢</span>
        <input
          type="number"
          name="age"
          min="10"
          max="120"
          defaultValue={existingProfile.age}
          required
          className="rounded-lg border border-orange-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">身長（cm）</span>
          <input
            type="number"
            name="heightCm"
            min="100"
            max="250"
            step="0.1"
            defaultValue={existingProfile.heightCm}
            required
            className="rounded-lg border border-orange-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">体重（kg）</span>
          <input
            type="number"
            name="weightKg"
            min="30"
            max="300"
            step="0.1"
            defaultValue={existingProfile.weightKg}
            required
            className="rounded-lg border border-orange-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">活動レベル</span>
        <select
          name="activityLevel"
          defaultValue={existingProfile.activityLevel}
          required
          className="rounded-lg border border-orange-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {Object.entries(activityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {/* PFCバランス */}
      <div className="border-t border-orange-200 pt-4 mt-1">
        <PfcPresetSelector
          defaultP={existingProfile.proteinPercent ?? 25}
          defaultF={existingProfile.fatPercent ?? 25}
          defaultC={existingProfile.carbPercent ?? 50}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-orange-300 px-5 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
