"use server";

import { db } from "@/db";
import { activityLogs, activityFavorites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/user";

export async function saveActivity(formData: FormData) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  const date = formData.get("date") as string;
  const activityType = formData.get("activityType") as string;
  const durationMinutes = Number(formData.get("durationMinutes"));
  const manualCalories = formData.get("manualCalories")
    ? Number(formData.get("manualCalories"))
    : null;
  const estimatedCalories = formData.get("estimatedCalories")
    ? Number(formData.get("estimatedCalories"))
    : null;
  const caloriesBurned = manualCalories || estimatedCalories || null;
  const memo = (formData.get("memo") as string) || null;
  const addToFavorite = formData.get("addToFavorite") === "on";

  if (!date || !activityType || !durationMinutes) {
    return { error: "日付・活動内容・時間は必須です" };
  }

  await db.insert(activityLogs).values({
    userId: user.id,
    date,
    activityType,
    durationMinutes,
    caloriesBurned,
    memo,
  });

  if (addToFavorite) {
    await db.insert(activityFavorites).values({
      userId: user.id,
      name: activityType,
      durationMinutes,
      caloriesBurned,
    });
  }

  return { success: true };
}

// 活動記録の時間を更新してカロリーを再計算
export async function updateActivityDuration(
  id: string,
  newDurationMinutes: number
) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  const clamped = Math.max(1, Math.min(600, Math.round(newDurationMinutes)));

  // 対象レコードを取得
  const rows = await db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.id, id), eq(activityLogs.userId, user.id)));

  if (rows.length === 0) {
    return { error: "記録が見つかりません" };
  }
  const activity = rows[0];

  // 既存の cal/分 比率を使って新しい時間でカロリーを再計算
  let newCalories: number | null = null;
  if (
    activity.caloriesBurned != null &&
    activity.durationMinutes > 0
  ) {
    const calPerMin = activity.caloriesBurned / activity.durationMinutes;
    newCalories = Math.round(calPerMin * clamped);
  }

  await db
    .update(activityLogs)
    .set({
      durationMinutes: clamped,
      caloriesBurned: newCalories,
    })
    .where(and(eq(activityLogs.id, id), eq(activityLogs.userId, user.id)));

  return { success: true };
}

// 活動記録を削除
export async function deleteActivity(id: string) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  await db
    .delete(activityLogs)
    .where(and(eq(activityLogs.id, id), eq(activityLogs.userId, user.id)));

  return { success: true };
}
