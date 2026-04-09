import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles, goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoalForm } from "../goal-form";
import { AppShell } from "../../components/app-shell";

export default async function BodymakeSettingPage() {
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
  const profile = profileRows[0];

  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));
  const goal = goalRows.length > 0 ? goalRows[0] : null;

  const currentWeight = Number(profile.weightKg);

  return (
    <AppShell>
      <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <Link
          href="/settings"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          &lt; 戻る
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-blue-600">ボディメイク</h1>
        </div>

        {goal ? (
          <>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-500">目標体重</span>
                <span className="text-sm font-medium">
                  {currentWeight} &rarr; {goal.targetWeightKg} kg
                </span>
              </div>
              {goal.targetBodyFatPercent && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-zinc-500">目標体脂肪率</span>
                  <span className="text-sm font-medium">
                    {profile.bodyFatPercent ?? "---"} &rarr;{" "}
                    {goal.targetBodyFatPercent} %
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-500">目標カロリー</span>
                <span className="text-sm font-medium">
                  {goal.dailyCalorieTarget} kcal/日
                </span>
              </div>
              {goal.startDate && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-zinc-500">開始日</span>
                  <span className="text-sm font-medium">{goal.startDate}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-500">終了日</span>
                <span className="text-sm font-medium">{goal.targetDate}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-500">PFCバランス</span>
                <span className="text-sm font-medium">
                  P:{goal.proteinPercent ?? 25}% F:{goal.fatPercent ?? 25}% C:
                  {goal.carbPercent ?? 50}%
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoalForm
                currentWeightKg={currentWeight}
                tdee={Number(profile.tdee)}
                existingGoal={goal}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-zinc-500 mb-4">
              目標がまだ設定されていません
            </p>
            <Link
              href="/goal"
              className="inline-block rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              目標を設定する
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
