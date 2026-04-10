// 日付ユーティリティ（JST基準）
//
// JavaScript の new Date().toISOString().split("T")[0] は UTC 基準のため、
// 日本時間の深夜〜朝9時の間は日付が1日ズレる。
// このモジュールは常に JST（Asia/Tokyo）基準の日付文字列を返す。

const JST_TZ = "Asia/Tokyo";

// YYYY-MM-DD 形式の JST 日付文字列を返す
export function jstDateString(date: Date = new Date()): string {
  // sv-SE ロケールは YYYY-MM-DD 形式を返す
  return date.toLocaleDateString("sv-SE", { timeZone: JST_TZ });
}

// 今日（JST）を YYYY-MM-DD で返す
export function jstToday(): string {
  return jstDateString(new Date());
}

// 指定日数前（JST）の日付を YYYY-MM-DD で返す
export function jstDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return jstDateString(d);
}
