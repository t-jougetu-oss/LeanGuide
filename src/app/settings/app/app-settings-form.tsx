"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAppSettings } from "./actions";

export function AppSettingsForm({
  pfcDecimalEnabled,
  heightUnit,
  weightUnit,
  homeCardType,
}: {
  pfcDecimalEnabled: boolean;
  heightUnit: string;
  weightUnit: string;
  homeCardType: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pfcDecimal, setPfcDecimal] = useState(pfcDecimalEnabled);
  const [hUnit, setHUnit] = useState(heightUnit);
  const [wUnit, setWUnit] = useState(weightUnit);
  const [cardType, setCardType] = useState(homeCardType);

  async function handleSave() {
    setSaving(true);
    await saveAppSettings({
      pfcDecimalEnabled: pfcDecimal,
      heightUnit: hUnit,
      weightUnit: wUnit,
      homeCardType: cardType,
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div>
      {/* 設定 */}
      <h2 className="text-sm font-medium text-zinc-500 mb-3">設定</h2>
      <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800 mb-6">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">PFCの小数点以下を有効にする</span>
          <button
            type="button"
            onClick={() => setPfcDecimal(!pfcDecimal)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              pfcDecimal ? "bg-amber-400" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          >
            <span
              className={`absolute left-0 top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                pfcDecimal ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">身長単位</span>
          <span className="text-sm text-zinc-500">{hUnit}</span>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">体重単位</span>
          <span className="text-sm text-zinc-500">{wUnit}</span>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">ホーム画面カード</span>
          <span className="text-sm text-zinc-500">
            {cardType === "toggle" ? "切り替えタイプ" : "固定タイプ"}
          </span>
        </div>
      </div>

      {/* その他 */}
      <h2 className="text-sm font-medium text-zinc-500 mb-3">その他</h2>
      <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800 mb-6">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">要望/お問い合わせ</span>
        </div>
      </div>

      {/* 情報 */}
      <h2 className="text-sm font-medium text-zinc-500 mb-3">情報</h2>
      <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800 mb-8">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">バージョン</span>
          <span className="text-sm text-zinc-500">1.3.0</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-full bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "保存中..." : "設定を保存"}
      </button>
    </div>
  );
}
