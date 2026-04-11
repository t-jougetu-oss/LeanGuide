"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateActivityDuration, deleteActivity } from "./actions";

type ActivityListItem = {
  id: string;
  activityType: string;
  durationMinutes: number;
  caloriesBurned: number | null;
  memo: string | null;
};

const activityLabels: Record<string, string> = {
  walking: "🚶 ウォーキング",
  running: "🏃 ランニング",
  cycling: "🚴 自転車",
  swimming: "🏊 水泳",
  weight_training: "🏋️ 筋トレ",
  yoga: "🧘 ヨガ/ストレッチ",
  stairs: "🪜 階段",
  cleaning: "🧹 掃除",
  dance: "💃 ダンス",
  tennis: "🎾 テニス",
  golf: "⛳ ゴルフ",
  hiking: "🥾 登山/ハイキング",
  other: "その他",
};

function formatActivity(type: string): string {
  return activityLabels[type] ?? type;
}

export function ActivityList({ activities }: { activities: ActivityListItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ActivityListItem | null>(null);
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function openEdit(activity: ActivityListItem) {
    setEditing(activity);
    setDuration(activity.durationMinutes);
    setConfirmingDelete(false);
  }

  function closeModal() {
    setEditing(null);
    setConfirmingDelete(false);
  }

  async function handleUpdate() {
    if (!editing) return;
    setSaving(true);
    const result = await updateActivityDuration(editing.id, duration);
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
    const result = await deleteActivity(editing.id);
    setSaving(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    closeModal();
    router.refresh();
  }

  // リアルタイムでカロリー再計算（既存の cal/分 比率を使用）
  const previewCal =
    editing && editing.caloriesBurned != null && editing.durationMinutes > 0
      ? Math.round(
          (editing.caloriesBurned / editing.durationMinutes) * duration
        )
      : null;

  return (
    <>
      <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800">
        {activities.map((activity) => (
          <button
            key={activity.id}
            type="button"
            onClick={() => openEdit(activity)}
            className="w-full px-4 py-3 text-left hover:bg-orange-50/60 active:bg-orange-100/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {formatActivity(activity.activityType)}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {activity.durationMinutes}分
                </p>
                {activity.memo && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {activity.memo}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activity.caloriesBurned != null && (
                  <span className="text-sm text-zinc-500">
                    {activity.caloriesBurned}kcal
                  </span>
                )}
                <span className="text-[10px] text-orange-500">›</span>
              </div>
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
              <h3 className="text-sm font-bold">活動を編集</h3>
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
                <div>
                  <div className="text-sm font-bold">
                    {formatActivity(editing.activityType)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    元の記録: {editing.durationMinutes}分
                    {editing.caloriesBurned != null &&
                      ` / ${editing.caloriesBurned}kcal`}
                  </div>
                </div>
              </div>

              {/* 時間スライダー */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    時間
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    {duration}
                    <span className="text-xs font-medium text-zinc-500 ml-0.5">
                      分
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>5分</span>
                  <span>60分</span>
                  <span>180分</span>
                </div>
                {duration !== editing.durationMinutes && (
                  <p className="text-[11px] text-orange-600 font-medium mt-2">
                    {editing.durationMinutes}分 → {duration}分
                  </p>
                )}
              </div>

              {/* プレビュー */}
              {previewCal != null && (
                <div className="rounded-lg bg-orange-100 dark:bg-zinc-800 border border-orange-300 dark:border-zinc-700 p-3 text-center">
                  <div className="text-[10px] text-zinc-500">消費カロリー</div>
                  <div className="text-lg font-bold text-orange-700">
                    {previewCal}
                    <span className="text-xs text-zinc-500 ml-1">kcal</span>
                  </div>
                  {editing.caloriesBurned != null &&
                    previewCal !== editing.caloriesBurned && (
                      <div className="text-[9px] text-zinc-400 mt-0.5">
                        {editing.caloriesBurned} → {previewCal} kcal
                      </div>
                    )}
                </div>
              )}

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
