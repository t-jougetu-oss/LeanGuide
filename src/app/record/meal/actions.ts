"use server";

import { db } from "@/db";
import { mealLogs } from "@/db/schema";
import { requireUser } from "@/lib/user";

export async function saveMeal(formData: FormData) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  const date = formData.get("date") as string;
  const mealType = formData.get("mealType") as string;
  const description = formData.get("description") as string;
  const calories = formData.get("calories")
    ? Number(formData.get("calories"))
    : null;
  const proteinGrams = formData.get("proteinGrams")
    ? Number(formData.get("proteinGrams"))
    : null;
  const fatGrams = formData.get("fatGrams")
    ? Number(formData.get("fatGrams"))
    : null;
  const carbGrams = formData.get("carbGrams")
    ? Number(formData.get("carbGrams"))
    : null;

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

  return { success: true };
}
