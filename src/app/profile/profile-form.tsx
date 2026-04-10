"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "./actions";
import { PfcPresetSelector } from "../components/pfc-preset-selector";
import { BirthDatePicker } from "../components/birthdate-picker";
import { calcAge } from "@/lib/calc";

type ExistingProfile = {
  gender: "male" | "female";
  birthDate: string | null;
  heightCm: string;
  weightKg: string;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  proteinPercent: number | null;
  fatPercent: number | null;
  carbPercent: number | null;
} | null;

const activityLabels = {
  sedentary: "ほぼ運動しない",
  light: "軽い運動（週1〜3回）",
  moderate: "中程度の運動（週3〜5回）",
  active: "激しい運動（週6〜7回）",
  very_active: "非常に激しい運動",
} as const;

export function ProfileForm({
  existingProfile,
}: {
  existingProfile: ExistingProfile;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [gender, setGender] = useState<"male" | "female">(
    existingProfile?.gender ?? "male"
  );
  const [birthDate, setBirthDate] = useState<string>(
    existingProfile?.birthDate ?? ""
  );

  const previewAge = useMemo(() => {
    if (!birthDate) return null;
    const a = calcAge(birthDate);
    if (Number.isNaN(a) || a < 0 || a > 150) return null;
    return a;
  }, [birthDate]);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");

    const result = await saveProfile(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push("/");
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {/* 性別 */}
      <div>
        <span className="text-sm font-medium mb-2 block">性別</span>
        <div className="flex gap-3">
          {([
            { value: "male", label: "男性" },
            { value: "female", label: "女性" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGender(opt.value)}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                gender === opt.value
                  ? "border-amber-600 bg-amber-600 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-orange-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="gender" value={gender} />
      </div>

      {/* 生年月日 */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">生年月日</span>
        <BirthDatePicker
          name="birthDate"
          value={birthDate}
          onChange={setBirthDate}
          required
        />
        {previewAge !== null && (
          <span className="text-xs text-zinc-500 mt-0.5">
            年齢: <span className="font-semibold text-orange-600">{previewAge}歳</span>（自動計算）
          </span>
        )}
      </div>

      {/* 身長 */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">身長（cm）</span>
        <input
          type="number"
          name="heightCm"
          min="100"
          max="250"
          step="0.1"
          defaultValue={existingProfile?.heightCm ?? ""}
          required
          className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：170.5"
        />
      </label>

      {/* 体重 */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">体重（kg）</span>
        <input
          type="number"
          name="weightKg"
          min="30"
          max="300"
          step="0.1"
          defaultValue={existingProfile?.weightKg ?? ""}
          required
          className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="例：65.0"
        />
      </label>

      {/* 活動レベル */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">活動レベル</span>
        <select
          name="activityLevel"
          defaultValue={existingProfile?.activityLevel ?? ""}
          required
          className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            選択してください
          </option>
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
          defaultP={existingProfile?.proteinPercent ?? 25}
          defaultF={existingProfile?.fatPercent ?? 25}
          defaultC={existingProfile?.carbPercent ?? 50}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
