"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calcBMR, calcTDEE } from "@/lib/calc";
import { findUserBySession } from "@/lib/user";

export async function saveProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "ログインしてください" };

  const gender = formData.get("gender") as "male" | "female";
  const age = Number(formData.get("age"));
  const heightCm = Number(formData.get("heightCm"));
  const weightKg = Number(formData.get("weightKg"));
  const activityLevel = formData.get("activityLevel") as
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "very_active";

  const proteinPercent = Number(formData.get("proteinPercent")) || 25;
  const fatPercent = Number(formData.get("fatPercent")) || 25;
  const carbPercent = Number(formData.get("carbPercent")) || 50;

  if (!gender || !age || !heightCm || !weightKg || !activityLevel) {
    return { error: "すべての項目を入力してください" };
  }

  const bmr = calcBMR(gender, weightKg, heightCm, age);
  const tdee = calcTDEE(bmr, activityLevel);

  // ユーザーを取得または作成
  let user = await findUserBySession(session.user);

  if (!user) {
    // 完全に新規ユーザー
    const inserted = await db
      .insert(users)
      .values({
        googleId: null,
        email: session.user.email!,
        name: session.user.name ?? session.user.email!,
        avatarUrl: session.user.image,
      })
      .returning();
    user = inserted[0];
  }

  const userId = user.id;

  // プロフィールを取得または作成
  const existingProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));

  if (existingProfile.length > 0) {
    await db
      .update(profiles)
      .set({
        gender,
        age,
        heightCm: String(heightCm),
        weightKg: String(weightKg),
        activityLevel,
        bmr: String(bmr),
        tdee: String(tdee),
        proteinPercent,
        fatPercent,
        carbPercent,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));
  } else {
    await db.insert(profiles).values({
      userId,
      gender,
      age,
      heightCm: String(heightCm),
      weightKg: String(weightKg),
      activityLevel,
      bmr: String(bmr),
      tdee: String(tdee),
      proteinPercent,
      fatPercent,
      carbPercent,
    });
  }

  return { success: true };
}
