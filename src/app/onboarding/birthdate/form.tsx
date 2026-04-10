"use client";

import { useMemo, useState } from "react";
import { saveBirthDate } from "./actions";
import { calcAge } from "@/lib/calc";

export function BirthDateOnboardingForm() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const previewAge = useMemo(() => {
    if (!birthDate) return null;
    const a = calcAge(birthDate);
    if (Number.isNaN(a) || a < 0 || a > 150) return null;
    return a;
  }, [birthDate]);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const result = await saveBirthDate(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
    // 成功時は action 内で redirect されるのでここに来ない
  }

  return (
    <form action={handleSubmit}>
      <section className="mt-8 rounded-2xl bg-white shadow-sm border border-orange-200 p-5">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">生年月日</span>
          <input
            type="date"
            name="birthDate"
            min="1900-01-01"
            max="2020-12-31"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-orange-300 px-4 py-3 text-base text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </label>

        <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-600">計算される年齢</span>
            <span className="text-2xl font-bold text-orange-600">
              {previewAge !== null ? previewAge : "—"}
              <span className="text-sm font-medium ml-1">歳</span>
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
          ※ 生年月日は他のユーザーには公開されません。年齢計算のためだけに使用します。
        </p>
      </section>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-6">
        <button
          type="submit"
          disabled={saving || previewAge === null}
          className="w-full rounded-full bg-orange-500 text-white text-base font-medium py-4 shadow-md active:scale-[0.98] transition disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存して始める"}
        </button>
      </div>
    </form>
  );
}
