"use server";

import { db } from "@/db";
import { weightLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/user";

export async function saveWeight(formData: FormData) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  const date = formData.get("date") as string;
  const weightKg = Number(formData.get("weightKg"));
  const bodyFatRaw = formData.get("bodyFatPercent");
  const bodyFatPercent = bodyFatRaw ? String(Number(bodyFatRaw)) : null;

  if (!date || !weightKg) {
    return { error: "すべての項目を入力してください" };
  }

  await db.insert(weightLogs).values({
    userId: user.id,
    date,
    weightKg: String(weightKg),
    bodyFatPercent,
  });

  return { success: true };
}

// 体重記録を編集
export async function updateWeight(
  id: string,
  weightKg: number,
  bodyFatPercent: number | null
) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  if (!weightKg || weightKg <= 0) {
    return { error: "体重を入力してください" };
  }

  await db
    .update(weightLogs)
    .set({
      weightKg: String(weightKg),
      bodyFatPercent:
        bodyFatPercent != null && bodyFatPercent > 0
          ? String(bodyFatPercent)
          : null,
    })
    .where(and(eq(weightLogs.id, id), eq(weightLogs.userId, user.id)));

  return { success: true };
}

// 体重記録を削除
export async function deleteWeight(id: string) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  await db
    .delete(weightLogs)
    .where(and(eq(weightLogs.id, id), eq(weightLogs.userId, user.id)));

  return { success: true };
}
