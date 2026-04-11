// 日付ユーティリティ（JST基準）
//
// JavaScript の new Date().toISOString().split("T")[0] は UTC 基準のため、
// 日本時間の深夜〜朝9時の間は日付が1日ズレる。
// このモジュールは常に JST（Asia/Tokyo）基準の日付文字列を返す。
//
// 実装は Intl/toLocaleDateString に依存せず、UTC+9 の算術のみで計算する。
// これにより Node.js の ICU 対応状況や環境差に影響されない。

const JST_OFFSET_MS = 9 * 60 * 60 * 1000; // UTC+9

// YYYY-MM-DD 形式の JST 日付文字列を返す
export function jstDateString(date: Date = new Date()): string {
  // UTC エポックに9時間足してから UTC 表現で取り出すと JST の壁時計時刻が得られる
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 今日（JST）を YYYY-MM-DD で返す
export function jstToday(): string {
  return jstDateString(new Date());
}

// 指定日数前（JST）の日付を YYYY-MM-DD で返す
export function jstDaysAgo(days: number): string {
  // 現在の UTC エポックから日数分引いてから JST 変換
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return jstDateString(d);
}
