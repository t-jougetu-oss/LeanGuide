"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calcBMR, calcTDEE } from "@/lib/calc";

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

  if (!gender || !age || !heightCm || !weightKg || !activityLevel) {
    return { error: "すべての項目を入力してください" };
  }

  const bmr = calcBMR(gender, weightKg, heightCm, age);
  const tdee = calcTDEE(bmr, activityLevel);

  // ユーザーを取得または作成
  let userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  if (userRows.length === 0) {
    userRows = await db
      .insert(users)
      .values({
        googleId: session.user.id!,
        email: session.user.email!,
        name: session.user.name!,
        avatarUrl: session.user.image,
      })
      .returning();
  }

  const userId = userRows[0].id;

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
    });
  }

  return { success: true };
}
