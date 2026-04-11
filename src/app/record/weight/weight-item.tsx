"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWeight, deleteWeight } from "./actions";

type WeightItemData = {
  id: string;
  date: string;
  weightKg: string;
  bodyFatPercent: string | null;
};

export function WeightItemList({ weights }: { weights: WeightItemData[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<WeightItemData | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function openEdit(item: WeightItemData) {
    setEditing(item);
    setWeightKg(item.weightKg);
    setBodyFat(item.bodyFatPercent ?? "");
    setConfirmingDelete(false);
  }

  function closeModal() {
    setEditing(null);
    setConfirmingDelete(false);
  }

  async function handleUpdate() {
    if (!editing) return;
    const w = Number(weightKg);
    if (!w || w <= 0) {
      alert("体重を入力してください");
      return;
    }
    setSaving(true);
    const bf = bodyFat ? Number(bodyFat) : null;
    const result = await updateWeight(editing.id, w, bf);
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
    const result = await deleteWeight(editing.id);
    setSaving(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    closeModal();
    router.refresh();
  }

  return (
    <>
      <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800">
        {weights.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => openEdit(w)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-orange-50/60 active:bg-orange-100/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="text-sm text-zinc-500">{w.date.slice(5)}</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-sm font-medium">{w.weightKg}kg</span>
                {w.bodyFatPercent && (
                  <span className="text-xs text-zinc-400 ml-2">
                    {w.bodyFatPercent}%
                  </span>
                )}
              </div>
              <span className="text-[10px] text-orange-500">›</span>
            </div>
          </button>
        ))}
      </div>

      {/* 編集モーダル */}
      {editing && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-md rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-orange-200 dark:border-zinc-800 shadow-2xl animate-[slideUp_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-orange-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold">体重を編集</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-xs text-zinc-500"
              >
                ✕ 閉じる
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 max-h-[75vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 dark:bg-zinc-800 dark:border-zinc-700">
                <div className="text-2xl">⚖️</div>
                <div>
                  <div className="text-sm font-bold">{editing.date} の体重</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    元の値: {editing.weightKg}kg
                    {editing.bodyFatPercent && ` / ${editing.bodyFatPercent}%`}
                  </div>
                </div>
              </div>

              {/* 体重入力 */}
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                  体重（kg）
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) =>
                    setWeightKg(
                      e.target.value
                        .replace(/[０-９]/g, (ch) =>
                          String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
                        )
                        .replace(/[^0-9.]/g, "")
                    )
                  }
                  className="w-full rounded-xl border-2 border-orange-400 bg-white dark:bg-zinc-900 px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="0.0"
                />
              </div>

              {/* 体脂肪率入力 */}
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                  体脂肪率（%）
                  <span className="text-zinc-400 ml-1">任意</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bodyFat}
                  onChange={(e) =>
                    setBodyFat(
                      e.target.value
                        .replace(/[０-９]/g, (ch) =>
                          String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
                        )
                        .replace(/[^0-9.]/g, "")
                    )
                  }
                  className="w-full rounded-xl border border-orange-300 bg-white dark:bg-zinc-900 px-4 py-3 text-lg text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="—"
                />
              </div>

              {/* ボタン */}
              <div className="flex flex-col gap-2 pt-2">
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
