"use server";

import { db } from "@/db";
import { weightLogs } from "@/db/schema";
import { requireUser } from "@/lib/user";

export async function saveWeight(formData: FormData) {
  const user = await requireUser();
  if (!user) return { error: "ログインしてください" };

  const date = formData.get("date") as string;
  const weightKg = Number(formData.get("weightKg"));

  if (!date || !weightKg) {
    return { error: "すべての項目を入力してください" };
  }

  await db.insert(weightLogs).values({
    userId: user.id,
    date,
    weightKg: String(weightKg),
  });

  return { success: true };
}
