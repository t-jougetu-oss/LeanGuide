"use server";

import { db } from "@/db";
import { activityLogs, activityFavorites } from "@/db/schema";
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
