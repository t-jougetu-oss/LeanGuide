"use server";

import { auth } from "@/auth";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles, goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calcDailyCalorieTarget, calcPFC } from "@/lib/calc";

export async function saveGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "ログインしてください" };

  const targetWeightKg = Number(formData.get("targetWeightKg"));
  const targetDate = formData.get("targetDate") as string;

  if (!targetWeightKg || !targetDate) {
    return { error: "すべての項目を入力してください" };
  }

  const user = await findUserBySession(session.user);
  if (!user) return { error: "プロフィールを先に登録してください" };

  const userId = user.id;

  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));

  if (profileRows.length === 0) return { error: "プロフィールを先に登録してください" };

  const profile = profileRows[0];
  const currentWeightKg = Number(profile.weightKg);
  const tdee = Number(profile.tdee);

  const daysToGoal = Math.ceil(
    (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysToGoal <= 0) return { error: "達成期限は未来の日付を入力してください" };

  const proteinPercent = Number(formData.get("proteinPercent")) || 25;
  const fatPercent = Number(formData.get("fatPercent")) || 25;
  const carbPercent = Number(formData.get("carbPercent")) || 50;

  const dailyCalorieTarget = calcDailyCalorieTarget(
    tdee,
    currentWeightKg,
    targetWeightKg,
    daysToGoal
  );

  // PFC%からグラム数を算出
  const proteinGrams = Math.round((dailyCalorieTarget * proteinPercent / 100) / 4);
  const fatGrams = Math.round((dailyCalorieTarget * fatPercent / 100) / 9);
  const carbGrams = Math.round((dailyCalorieTarget * carbPercent / 100) / 4);

  const existingGoal = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  if (existingGoal.length > 0) {
    await db
      .update(goals)
      .set({
        targetWeightKg: String(targetWeightKg),
        targetDate,
        dailyCalorieTarget,
        proteinPercent,
        fatPercent,
        carbPercent,
        proteinGrams,
        fatGrams,
        carbGrams,
        updatedAt: new Date(),
      })
      .where(eq(goals.userId, userId));
  } else {
    await db.insert(goals).values({
      userId,
      targetWeightKg: String(targetWeightKg),
      targetDate,
      dailyCalorieTarget,
      proteinPercent,
      fatPercent,
      carbPercent,
      proteinGrams,
      fatGrams,
      carbGrams,
    });
  }

  return { success: true };
}
