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

  // 基準量（100%時）の値。後で編集モーダルで分量スライダーを復元するために保存
  const basePortion = (formData.get("basePortion") as string) || null;
  const portionPercentRaw = formData.get("portionPercent");
  const portionPercent = portionPercentRaw
    ? Math.round(Number(portionPercentRaw))
    : 100;
  const baseCaloriesRaw =
    rawCalories !== null ? Math.round(rawCalories) : null;
  const baseProtein = formData.get("baseProtein")
    ? Math.round(Number(formData.get("baseProtein")))
    : proteinGrams;
  const baseFat = formData.get("baseFat")
    ? Math.round(Number(formData.get("baseFat")))
    : fatGrams;
  const baseCarb = formData.get("baseCarb")
    ? Math.round(Number(formData.get("baseCarb")))
    : carbGrams;

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
    basePortion,
    portionPercent,
    baseCalories: baseCaloriesRaw,
    baseProteinGrams: baseProtein,
    baseFatGrams: baseFat,
    baseCarbGrams: baseCarb,
  });

  if (addToFavorite) {
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
        calories: baseCaloriesRaw,
        proteinGrams: baseProtein,
        fatGrams: baseFat,
        carbGrams: baseCarb,
      });
    }
  }

  return { success: true };
}

// 既存の食事記録の分量（%）を更新してPFC・カロリーを再計算する
export async function updateMealPortion(
  mealId: string,
  newPortionPercent: number
) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  // 10〜200 の範囲内にクランプ
  const clamped = Math.max(10, Math.min(200, Math.round(newPortionPercent)));

  // 対象レコードを取得して本人のものか確認
  const rows = await db
    .select()
    .from(mealLogs)
    .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, user.id)));

  if (rows.length === 0) {
    return { error: "記録が見つかりません" };
  }
  const meal = rows[0];

  // 基準値。古いレコード（base系がNULL）は現在値を 100% 基準として扱う
  const baseCal = meal.baseCalories ?? meal.calories ?? 0;
  const baseP = meal.baseProteinGrams ?? meal.proteinGrams ?? 0;
  const baseF = meal.baseFatGrams ?? meal.fatGrams ?? 0;
  const baseC = meal.baseCarbGrams ?? meal.carbGrams ?? 0;

  const ratio = clamped / 100;

  await db
    .update(mealLogs)
    .set({
      calories: Math.round(baseCal * ratio),
      proteinGrams: Math.round(baseP * ratio),
      fatGrams: Math.round(baseF * ratio),
      carbGrams: Math.round(baseC * ratio),
      portionPercent: clamped,
      // 古いレコードの場合は base 値もここで保存しておく
      baseCalories: meal.baseCalories ?? baseCal,
      baseProteinGrams: meal.baseProteinGrams ?? baseP,
      baseFatGrams: meal.baseFatGrams ?? baseF,
      baseCarbGrams: meal.baseCarbGrams ?? baseC,
    })
    .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, user.id)));

  return { success: true };
}

// 食事記録を削除
export async function deleteMeal(mealId: string) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  await db
    .delete(mealLogs)
    .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, user.id)));

  return { success: true };
}

// 食事記録をお気に入りに追加／解除（トグル）
// - 未登録ならレコードの baseCalories 等を使って mealFavorites に INSERT
// - すでに同名が登録済みなら mealFavorites から DELETE
// - meal_logs は一切変更しない
export async function toggleMealFavorite(mealId: string) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  // 対象の食事記録を取得
  const mealRows = await db
    .select()
    .from(mealLogs)
    .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, user.id)));

  if (mealRows.length === 0) {
    return { error: "記録が見つかりません" };
  }
  const meal = mealRows[0];

  // 同名のお気に入りがすでにあるかチェック
  const existing = await db
    .select()
    .from(mealFavorites)
    .where(
      and(
        eq(mealFavorites.userId, user.id),
        eq(mealFavorites.name, meal.description)
      )
    );

  if (existing.length > 0) {
    // 解除
    await db
      .delete(mealFavorites)
      .where(
        and(
          eq(mealFavorites.userId, user.id),
          eq(mealFavorites.name, meal.description)
        )
      );
    return { success: true, isFavorited: false };
  }

  // 新規追加：base 値（100%基準）を使う。
  // 古いレコードで base* が NULL の場合は現在値を 100% 扱いで保存
  const baseCal = meal.baseCalories ?? meal.calories;
  const baseP = meal.baseProteinGrams ?? meal.proteinGrams;
  const baseF = meal.baseFatGrams ?? meal.fatGrams;
  const baseC = meal.baseCarbGrams ?? meal.carbGrams;

  await db.insert(mealFavorites).values({
    userId: user.id,
    name: meal.description,
    calories: baseCal,
    proteinGrams: baseP,
    fatGrams: baseF,
    carbGrams: baseC,
  });

  return { success: true, isFavorited: true };
}
