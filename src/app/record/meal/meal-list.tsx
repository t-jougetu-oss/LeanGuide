"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMealPortion, deleteMeal } from "./actions";

type MealListItem = {
  id: string;
  mealType: string;
  description: string;
  calories: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  carbGrams: number | null;
  basePortion: string | null;
  portionPercent: number | null;
  baseCalories: number | null;
  baseProteinGrams: number | null;
  baseFatGrams: number | null;
  baseCarbGrams: number | null;
};

const mealTypeLabels: Record<string, string> = {
  meal: "食事",
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export function MealList({ meals }: { meals: MealListItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MealListItem | null>(null);
  // モーダル内で操作する分量（%）
  const [portion, setPortion] = useState(100);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function openEdit(meal: MealListItem) {
    setEditing(meal);
    // 古いレコードで portionPercent が NULL の場合は 100 を初期値に
    setPortion(meal.portionPercent ?? 100);
    setConfirmingDelete(false);
  }

  function closeModal() {
    setEditing(null);
    setConfirmingDelete(false);
  }

  async function handleUpdate() {
    if (!editing) return;
    setSaving(true);
    const result = await updateMealPortion(editing.id, portion);
    setSaving(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    closeModal();
    router.refresh();
  }

  async function handleDelete() {
    if (!editing) return;
    setSaving(true);
    const result = await deleteMeal(editing.id);
    setSaving(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    closeModal();
    router.refresh();
  }

  // モーダル内で分量を動かしたときのリアルタイム計算
  const ratio = portion / 100;
  const previewCal = editing
    ? Math.round(
        (editing.baseCalories ?? editing.calories ?? 0) * ratio
      )
    : 0;
  const previewP = editing
    ? Math.round(
        (editing.baseProteinGrams ?? editing.proteinGrams ?? 0) * ratio
      )
    : 0;
  const previewF = editing
    ? Math.round(
        (editing.baseFatGrams ?? editing.fatGrams ?? 0) * ratio
      )
    : 0;
  const previewC = editing
    ? Math.round(
        (editing.baseCarbGrams ?? editing.carbGrams ?? 0) * ratio
      )
    : 0;

  return (
    <>
      <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800">
        {meals.map((meal) => (
          <button
            key={meal.id}
            type="button"
            onClick={() => openEdit(meal)}
            className="w-full px-4 py-3 text-left hover:bg-orange-50/60 active:bg-orange-100/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">
                {mealTypeLabels[meal.mealType] ?? meal.mealType}
              </span>
              <div className="flex items-center gap-2">
                {meal.calories != null && (
                  <span className="text-xs text-zinc-400">
                    {meal.calories}kcal
                  </span>
                )}
                <span className="text-[10px] text-orange-500">›</span>
              </div>
            </div>
            <p className="text-sm mt-1">{meal.description}</p>
            {(meal.proteinGrams != null ||
              meal.fatGrams != null ||
              meal.carbGrams != null) && (
              <p className="text-xs text-zinc-400 mt-1">
                P:{meal.proteinGrams ?? 0}g / F:{meal.fatGrams ?? 0}g / C:
                {meal.carbGrams ?? 0}g
              </p>
            )}
          </button>
        ))}
      </div>

      {/* 編集モーダル（ボトムシート） */}
      {editing && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={closeModal}
        >
          {/* 背景オーバーレイ */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* シート本体 */}
          <div
            className="relative w-full max-w-md rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-orange-200 dark:border-zinc-800 shadow-2xl animate-[slideUp_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ハンドル */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* ヘッダー */}
            <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-orange-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold">記録を編集</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-xs text-zinc-500"
              >
                ✕ 閉じる
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 max-h-[75vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {/* 食品情報 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 dark:bg-zinc-800 dark:border-zinc-700">
                <div>
                  <div className="text-[10px] text-zinc-500">
                    {mealTypeLabels[editing.mealType] ?? editing.mealType}
                  </div>
                  <div className="text-sm font-bold">{editing.description}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    基準:{" "}
                    {editing.basePortion ?? "—"}
                    {editing.baseCalories != null &&
                      ` / ${editing.baseCalories}kcal`}
                  </div>
                </div>
              </div>

              {/* スライダー */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    分量
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    {portion}
                    <span className="text-xs font-medium text-zinc-500 ml-0.5">
                      %
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={portion}
                  onChange={(e) => setPortion(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>10%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
                {editing.portionPercent != null &&
                  portion !== editing.portionPercent && (
                    <p className="text-[11px] text-orange-600 font-medium mt-2">
                      {editing.portionPercent}% → {portion}% に変更
                    </p>
                  )}
              </div>

              {/* プレビュー（リアルタイム計算） */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-orange-50 dark:bg-zinc-800 py-2 border border-orange-100 dark:border-zinc-700">
                  <div className="text-[10px] text-zinc-500">kcal</div>
                  <div className="text-sm font-bold text-orange-600">
                    {previewCal}
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 dark:bg-zinc-800 py-2 border border-orange-100 dark:border-zinc-700">
                  <div className="text-[10px] text-zinc-500">P</div>
                  <div className="text-sm font-bold text-orange-600">
                    {previewP}g
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 dark:bg-zinc-800 py-2 border border-orange-100 dark:border-zinc-700">
                  <div className="text-[10px] text-zinc-500">F</div>
                  <div className="text-sm font-bold text-orange-600">
                    {previewF}g
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 dark:bg-zinc-800 py-2 border border-orange-100 dark:border-zinc-700">
                  <div className="text-[10px] text-zinc-500">C</div>
                  <div className="text-sm font-bold text-orange-600">
                    {previewC}g
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex flex-col gap-2 pt-2 pb-4">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-bold shadow-sm active:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? "保存中..." : "更新する"}
                </button>

                {confirmingDelete ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 p-3">
                    <p className="text-xs text-red-600 dark:text-red-400 text-center">
                      この記録を削除します。よろしいですか？
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        disabled={saving}
                        className="flex-1 py-2 rounded-lg border border-zinc-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-xs font-medium disabled:opacity-50"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving}
                        className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold active:bg-red-600 disabled:opacity-50"
                      >
                        削除する
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={saving}
                    className="w-full py-3 rounded-xl border border-red-300 bg-white dark:bg-zinc-900 text-red-500 text-sm font-semibold active:bg-red-50 dark:active:bg-red-900/20 disabled:opacity-50"
                  >
                    🗑 この記録を削除
                  </button>
                )}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
