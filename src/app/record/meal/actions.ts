"use server";

import { db } from "@/db";
import { mealLogs, mealFavorites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/user";

export async function saveMeal(formData: FormData) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  const date = formData.get("date") as string;
  const mealType = formData.get("mealType") as string;
  const description = formData.get("description") as string;

  // 分量調整済みカロリーがあればそちらを使う
  const adjustedCalories = formData.get("adjustedCalories")
    ? Number(formData.get("adjustedCalories"))
    : null;
  const rawCalories = formData.get("calories")
    ? Number(formData.get("calories"))
    : null;
  const caloriesRaw = adjustedCalories || rawCalories;
  const calories = caloriesRaw !== null ? Math.round(caloriesRaw) : null;

  const proteinRaw = formData.get("proteinGrams")
    ? Number(formData.get("proteinGrams"))
    : null;
  const fatRaw = formData.get("fatGrams")
    ? Number(formData.get("fatGrams"))
    : null;
  const carbRaw = formData.get("carbGrams")
    ? Number(formData.get("carbGrams"))
    : null;

  // DB は integer なので四捨五入
  const proteinGrams = proteinRaw !== null ? Math.round(proteinRaw) : null;
  const fatGrams = fatRaw !== null ? Math.round(fatRaw) : null;
  const carbGrams = carbRaw !== null ? Math.round(carbRaw) : null;
  const addToFavorite = formData.get("addToFavorite") === "on";

  if (!date || !mealType || !description) {
    return { error: "日付・食事タイプ・内容は必須です" };
  }

  await db.insert(mealLogs).values({
    userId: user.id,
    date,
    mealType,
    description,
    calories,
    proteinGrams,
    fatGrams,
    carbGrams,
  });

  if (addToFavorite) {
    // お気に入りは基準量（100%）の値で保存
    const baseCalories = rawCalories !== null ? Math.round(rawCalories) : null;
    const baseProtein = formData.get("baseProtein")
      ? Math.round(Number(formData.get("baseProtein")))
      : proteinGrams;
    const baseFat = formData.get("baseFat")
      ? Math.round(Number(formData.get("baseFat")))
      : fatGrams;
    const baseCarb = formData.get("baseCarb")
      ? Math.round(Number(formData.get("baseCarb")))
      : carbGrams;

    // 同名の食品が既にお気に入りにあれば追加しない
    const existing = await db
      .select()
      .from(mealFavorites)
      .where(
        and(
          eq(mealFavorites.userId, user.id),
          eq(mealFavorites.name, description)
        )
      );

    if (existing.length === 0) {
      await db.insert(mealFavorites).values({
        userId: user.id,
        name: description,
        calories: baseCalories,
        proteinGrams: baseProtein,
        fatGrams: baseFat,
        carbGrams: baseCarb,
      });
    }
  }

  return { success: true };
}
