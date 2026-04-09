import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles, goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoalForm } from "./goal-form";

export default async function GoalPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");

  const userId = user.id;

  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));

  if (profileRows.length === 0) redirect("/profile");

  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  const profile = profileRows[0];
  const existingGoal = goalRows.length > 0 ? goalRows[0] : null;

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">目標設定</h1>
        <p className="text-sm text-center text-zinc-500 mb-8">
          現在の体重: {profile.weightKg}kg ／ TDEE: {profile.tdee}kcal
        </p>
        <GoalForm
          currentWeightKg={Number(profile.weightKg)}
          tdee={Number(profile.tdee)}
          existingGoal={existingGoal}
        />
      </div>
    </div>
  );
}
