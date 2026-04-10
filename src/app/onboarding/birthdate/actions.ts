"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { findUserBySession } from "@/lib/user";
import { calcAge, calcBMR, calcTDEE } from "@/lib/calc";
import { redirect } from "next/navigation";

export async function saveBirthDate(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "ログインしてください" };

  const birthDate = (formData.get("birthDate") as string) || "";
  if (!birthDate) return { error: "生年月日を入力してください" };

  const age = calcAge(birthDate);
  if (age < 10 || age > 120) {
    return { error: "生年月日が正しくありません" };
  }

  const user = await findUserBySession(session.user);
  if (!user) return { error: "ユーザーが見つかりません" };

  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id));

  if (profileRows.length === 0) {
    return { error: "プロフィールが見つかりません" };
  }

  const profile = profileRows[0];

  // 年齢が変わるので BMR/TDEE も再計算
  const bmr = calcBMR(
    profile.gender,
    Number(profile.weightKg),
    Number(profile.heightCm),
    age
  );
  const tdee = calcTDEE(bmr, profile.activityLevel);

  await db
    .update(profiles)
    .set({
      birthDate,
      age,
      bmr: String(bmr),
      tdee: String(tdee),
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id));

  redirect("/dashboard");
}
