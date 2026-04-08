"use server";

import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { requireUser } from "@/lib/user";

export async function saveActivity(formData: FormData) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  const date = formData.get("date") as string;
  const activityType = formData.get("activityType") as string;
  const durationMinutes = Number(formData.get("durationMinutes"));
  const caloriesBurned = formData.get("caloriesBurned")
    ? Number(formData.get("caloriesBurned"))
    : null;

  if (!date || !activityType || !durationMinutes) {
    return { error: "日付・活動内容・時間は必須です" };
  }

  await db.insert(activityLogs).values({
    userId: user.id,
    date,
    activityType,
    durationMinutes,
    caloriesBurned,
  });

  return { success: true };
}
