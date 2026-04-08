import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users, profiles, activityLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ActivityForm } from "./activity-form";
import { AppShell } from "../../components/app-shell";
import { RecordTabs } from "../../components/record-tabs";

export default async function ActivityRecordPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  if (userRows.length === 0) redirect("/profile");
  const userId = userRows[0].id;

  // プロフィールから体重を取得（カロリー推定用）
  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));

  const weightKg = profileRows.length > 0 ? Number(profileRows[0].weightKg) : 65;

  const today = new Date().toISOString().split("T")[0];

  // 今日の活動記録
  const todayActivities = await db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.userId, userId), eq(activityLogs.date, today)))
    .orderBy(sql`${activityLogs.createdAt} asc`);

  const totalMinutes = todayActivities.reduce(
    (sum, a) => sum + a.durationMinutes,
    0
  );
  const totalCalories = todayActivities.reduce(
    (sum, a) => sum + (a.caloriesBurned ?? 0),
    0
  );

  return (
    <AppShell>
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">記録する</h1>
        <RecordTabs />
        <ActivityForm weightKg={weightKg} />

        {/* 今日の活動一覧 */}
        {todayActivities.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 mb-3">
              今日の活動
            </h2>

            {/* 合計 */}
            <div className="rounded-xl border border-zinc-200 p-4 mb-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">本日の合計</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{totalMinutes}</p>
                  <p className="text-xs text-zinc-400">分</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{totalCalories}</p>
                  <p className="text-xs text-zinc-400">kcal消費</p>
                </div>
              </div>
            </div>

            {/* 一覧 */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              {todayActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {activity.activityType}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {activity.durationMinutes}分
                    </p>
                  </div>
                  {activity.caloriesBurned != null && (
                    <span className="text-sm text-zinc-500">
                      {activity.caloriesBurned}kcal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </AppShell>
  );
}
