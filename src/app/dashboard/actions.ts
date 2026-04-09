"use server";

import { db } from "@/db";
import { mealLogs, activityLogs, weightLogs } from "@/db/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";

export async function getDashboardData(userId: string, date: string) {
  // 食事集計
  const todayMeals = await db
    .select({
      totalCalories: sql<number>`coalesce(sum(${mealLogs.calories}), 0)`,
      totalProtein: sql<number>`coalesce(sum(${mealLogs.proteinGrams}), 0)`,
      totalFat: sql<number>`coalesce(sum(${mealLogs.fatGrams}), 0)`,
      totalCarb: sql<number>`coalesce(sum(${mealLogs.carbGrams}), 0)`,
    })
    .from(mealLogs)
    .where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, date)));

  // 運動消費カロリー
  const todayExercise = await db
    .select({
      totalBurned: sql<number>`coalesce(sum(${activityLogs.caloriesBurned}), 0)`,
    })
    .from(activityLogs)
    .where(and(eq(activityLogs.userId, userId), eq(activityLogs.date, date)));

  // その日までの最新体重
  const latestWeight = await db
    .select()
    .from(weightLogs)
    .where(and(eq(weightLogs.userId, userId), sql`${weightLogs.date} <= ${date}`))
    .orderBy(desc(weightLogs.date))
    .limit(1);

  const meals = todayMeals[0];
  const weight = latestWeight.length > 0 ? latestWeight[0] : null;

  return {
    totalCalories: Number(meals.totalCalories),
    totalProtein: Number(meals.totalProtein),
    totalFat: Number(meals.totalFat),
    totalCarb: Number(meals.totalCarb),
    exerciseCalories: Number(todayExercise[0]?.totalBurned ?? 0),
    currentWeight: weight ? Number(weight.weightKg) : null,
    currentBodyFat: weight?.bodyFatPercent ? Number(weight.bodyFatPercent) : null,
  };
}
