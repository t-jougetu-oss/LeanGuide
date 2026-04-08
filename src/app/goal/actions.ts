"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, profiles, goals } from "@/db/schema";
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

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  if (userRows.length === 0) return { error: "プロフィールを先に登録してください" };

  const userId = userRows[0].id;

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

  const dailyCalorieTarget = calcDailyCalorieTarget(
    tdee,
    currentWeightKg,
    targetWeightKg,
    daysToGoal
  );
  const pfc = calcPFC(dailyCalorieTarget, currentWeightKg);

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
        proteinGrams: pfc.protein,
        fatGrams: pfc.fat,
        carbGrams: pfc.carb,
        updatedAt: new Date(),
      })
      .where(eq(goals.userId, userId));
  } else {
    await db.insert(goals).values({
      userId,
      targetWeightKg: String(targetWeightKg),
      targetDate,
      dailyCalorieTarget,
      proteinGrams: pfc.protein,
      fatGrams: pfc.fat,
      carbGrams: pfc.carb,
    });
  }

  return { success: true };
}
