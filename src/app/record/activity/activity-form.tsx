"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveActivity } from "./actions";
import { DateInput } from "../../components/date-input";
import { jstToday } from "@/lib/date";

const activityPresets = [
  { value: "walking", label: "ウォーキング", metPerMin: 3.5 },
  { value: "running", label: "ランニング", metPerMin: 8.0 },
  { value: "cycling", label: "自転車", metPerMin: 6.0 },
  { value: "swimming", label: "水泳", metPerMin: 7.0 },
  { value: "weight_training", label: "筋トレ", metPerMin: 5.0 },
  { value: "yoga", label: "ヨガ/ストレッチ", metPerMin: 2.5 },
  { value: "stairs", label: "階段", metPerMin: 4.0 },
  { value: "cleaning", label: "掃除", metPerMin: 3.0 },
  { value: "dance", label: "ダンス", metPerMin: 5.5 },
  { value: "tennis", label: "テニス", metPerMin: 7.0 },
  { value: "golf", label: "ゴルフ", metPerMin: 3.5 },
  { value: "hiking", label: "登山/ハイキング", metPerMin: 6.0 },
] as const;

type Favorite = {
  id: string;
  name: string;
  durationMinutes: number | null;
  caloriesBurned: number | null;
};

type Tab = "direct" | "favorites";

export function ActivityForm({
  weightKg,
  favorites = [],
  defaultDate,
}: {
  weightKg: number;
  favorites?: Favorite[];
  defaultDate?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("direct");
  const [activityType, setActivityType] = useState("walking");
  const [duration, setDuration] = useState("");
  const [memo, setMemo] = useState("");
  const [addToFavorite, setAddToFavorite] = useState(false);
  const [customName, setCustomName] = useState("");

  const estimatedCalories = useMemo(() => {
    const preset = activityPresets.find((p) => p.value === activityType);
    const met = preset ? preset.metPerMin : (customName ? 4.0 : null);
    const mins = Number(duration);
    if (!met || !mins || mins <= 0) return null;
    return Math.round((met * weightKg * mins) / 60);
  }, [activityType, duration, weightKg, customName]);

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
      setMemo("");
      setAddToFavorite(false);
      setCustomName("");
    }
  }

  function applyFavorite(fav: Favorite) {
    setCustomName(fav.name);
    if (fav.durationMinutes) setDuration(String(fav.durationMinutes));
    setTab("direct");
    setActivityType("other");
  }

  const selectedLabel =
    activityPresets.find((p) => p.value === activityType)?.label ?? "その他";

  return (
    <div className="flex flex-col gap-5">
      {/* タブ */}
      <div className="flex rounded-lg border border-orange-300 dark:border-zinc-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setTab("direct")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === "direct"
              ? "bg-amber-600 text-white dark:bg-white dark:text-zinc-900"
              : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          直接入力
        </button>
        <button
          type="button"
          onClick={() => setTab("favorites")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === "favorites"
              ? "bg-amber-600 text-white dark:bg-white dark:text-zinc-900"
              : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          お気に入り
        </button>
      </div>

      {tab === "favorites" ? (
        <div className="flex flex-col gap-1">
          {favorites.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">
              お気に入りがまだありません。
              <br />
              記録時に「お気に入りに追加」をオンにすると登録されます。
            </p>
          ) : (
            <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800">
              {favorites.map((fav) => (
                <button
                  key={fav.id}
                  type="button"
                  onClick={() => applyFavorite(fav)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm">{fav.name}</span>
                  {fav.durationMinutes && (
                    <span className="text-xs text-zinc-400">
                      {fav.durationMinutes}分
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form action={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">日付</span>
            <DateInput
              name="date"
              defaultValue={defaultDate ?? jstToday()}
              required
            />
          </div>

          {/* 活動内容 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">活動内容</span>
            <div className="grid grid-cols-3 gap-2">
              {activityPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setActivityType(preset.value);
                    setCustomName("");
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    activityType === preset.value && !customName
                      ? "border-amber-600 bg-amber-600 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-orange-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCustomName(customName || " ");
                  setActivityType("other");
                }}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors flex items-center justify-center gap-1 ${
                  customName
                    ? "border-amber-600 bg-amber-600 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-dashed border-zinc-400 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-500 dark:hover:bg-zinc-800"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                その他を入力
              </button>
            </div>
            {customName !== "" && (
              <input
                type="text"
                value={customName.trim()}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="運動名を入力（例: バドミントン）"
                className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                autoFocus
              />
            )}
          </div>
          <input
            type="hidden"
            name="activityType"
            value={customName.trim() || selectedLabel}
          />

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">時間（分）</span>
            <input
              type="number"
              name="durationMinutes"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              required
              className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="例：30"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">消費カロリー（kcal）</span>
            <input
              type="number"
              name="manualCalories"
              min="0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder={
                estimatedCalories !== null
                  ? `推定: ${estimatedCalories}`
                  : "0"
              }
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
            name="estimatedCalories"
            value={estimatedCalories ?? ""}
          />

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">詳細メモ</span>
            <textarea
              name="memo"
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="メモ（任意）"
            />
          </label>

          {/* お気に入り追加トグル */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">お気に入りに追加</span>
            <button
              type="button"
              onClick={() => setAddToFavorite(!addToFavorite)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                addToFavorite ? "bg-amber-400" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  addToFavorite ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
            <input type="hidden" name="addToFavorite" value={addToFavorite ? "on" : ""} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "保存中..." : "記録する"}
          </button>
        </form>
      )}
    </div>
  );
}
