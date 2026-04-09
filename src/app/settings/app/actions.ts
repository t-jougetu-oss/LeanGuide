"use server";

import { auth } from "@/auth";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function saveAppSettings(data: {
  pfcDecimalEnabled: boolean;
  heightUnit: string;
  weightUnit: string;
  homeCardType: string;
}) {
  const session = await auth();
  if (!session?.user) return { error: "ログインしてください" };

  const user = await findUserBySession(session.user);
  if (!user) return { error: "ユーザーが見つかりません" };
  const userId = user.id;

  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.userId, userId));

  if (existing.length > 0) {
    await db
      .update(appSettings)
      .set({
        pfcDecimalEnabled: data.pfcDecimalEnabled,
        heightUnit: data.heightUnit,
        weightUnit: data.weightUnit,
        homeCardType: data.homeCardType,
        updatedAt: new Date(),
      })
      .where(eq(appSettings.userId, userId));
  } else {
    await db.insert(appSettings).values({
      userId,
      pfcDecimalEnabled: data.pfcDecimalEnabled,
      heightUnit: data.heightUnit,
      weightUnit: data.weightUnit,
      homeCardType: data.homeCardType,
    });
  }

  return { success: true };
}
