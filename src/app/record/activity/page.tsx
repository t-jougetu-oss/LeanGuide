import { auth } from "@/auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles, activityLogs, activityFavorites } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { ActivityForm } from "./activity-form";
import { ActivityList } from "./activity-list";
import { AppShell } from "../../components/app-shell";
import { RecordTabs } from "../../components/record-tabs";
import { RecordDateNav } from "../../components/record-date-nav";
import { jstToday } from "@/lib/date";

export default async function ActivityRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");
  const userId = user.id;

  const sp = await searchParams;
  const today = jstToday();
  const selectedDate = sp.date ?? today;
  const isToday = selectedDate === today;

  // プロフィールから体重を取得（カロリー推定用）
  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));

  const weightKg = profileRows.length > 0 ? Number(profileRows[0].weightKg) : 65;

  // 選択日の活動記録
  const activitiesOfDay = await db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.userId, userId), eq(activityLogs.date, selectedDate)))
    .orderBy(sql`${activityLogs.createdAt} asc`);

  // お気に入り取得
  const favRows = await db
    .select()
    .from(activityFavorites)
    .where(eq(activityFavorites.userId, userId))
    .orderBy(desc(activityFavorites.createdAt));

  const totalMinutes = activitiesOfDay.reduce(
    (sum, a) => sum + a.durationMinutes,
    0
  );
  const totalCalories = activitiesOfDay.reduce(
    (sum, a) => sum + (a.caloriesBurned ?? 0),
    0
  );

  const sectionTitle = isToday
    ? "今日の活動"
    : `${Number(selectedDate.slice(5, 7))}月${Number(selectedDate.slice(8, 10))}日の活動`;

  return (
    <AppShell>
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">記録する</h1>
        <RecordTabs />
        <RecordDateNav selectedDate={selectedDate} />
        <ActivityForm
          weightKg={weightKg}
          favorites={favRows}
          defaultDate={selectedDate}
        />

        {/* 選択日の活動一覧 */}
        {activitiesOfDay.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 mb-3">
              {sectionTitle}
            </h2>

            {/* 合計 */}
            <div className="rounded-xl border border-orange-200 p-4 mb-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">
                {isToday ? "本日の合計" : "この日の合計"}
              </p>
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

            {/* 一覧（タップで編集モーダル） */}
            <ActivityList
              activities={activitiesOfDay.map((a) => ({
                id: a.id,
                activityType: a.activityType,
                durationMinutes: a.durationMinutes,
                caloriesBurned: a.caloriesBurned,
                memo: a.memo,
              }))}
            />
          </section>
        ) : (
          <p className="mt-8 text-center text-xs text-zinc-400">
            {isToday
              ? "今日の活動はまだありません"
              : "この日の活動はありません"}
          </p>
        )}
      </div>
    </div>
    </AppShell>
  );
}
