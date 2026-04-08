import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users, goals, mealLogs, weightLogs, activityLogs } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  if (userRows.length === 0) redirect("/profile");
  const userId = userRows[0].id;

  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));
  const goal = goalRows.length > 0 ? goalRows[0] : null;

  // 直近7日間
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  // 食事の週間合計
  const mealSummary = await db
    .select({
      totalCalories: sql<number>`coalesce(sum(${mealLogs.calories}), 0)`,
      totalProtein: sql<number>`coalesce(sum(${mealLogs.proteinGrams}), 0)`,
      totalFat: sql<number>`coalesce(sum(${mealLogs.fatGrams}), 0)`,
      totalCarb: sql<number>`coalesce(sum(${mealLogs.carbGrams}), 0)`,
      mealCount: sql<number>`count(*)`,
    })
    .from(mealLogs)
    .where(
      and(
        eq(mealLogs.userId, userId),
        gte(mealLogs.date, startDate),
        lte(mealLogs.date, endDate)
      )
    );

  // 体重の推移
  const weights = await db
    .select()
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        gte(weightLogs.date, startDate),
        lte(weightLogs.date, endDate)
      )
    )
    .orderBy(weightLogs.date);

  // 活動の週間合計
  const activitySummary = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(${activityLogs.durationMinutes}), 0)`,
      totalCaloriesBurned: sql<number>`coalesce(sum(${activityLogs.caloriesBurned}), 0)`,
      activityCount: sql<number>`count(*)`,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        gte(activityLogs.date, startDate),
        lte(activityLogs.date, endDate)
      )
    );

  const meals = mealSummary[0];
  const activities = activitySummary[0];

  const firstWeight =
    weights.length > 0 ? Number(weights[0].weightKg) : null;
  const lastWeight =
    weights.length > 0 ? Number(weights[weights.length - 1].weightKg) : null;
  const weightChange =
    firstWeight && lastWeight ? lastWeight - firstWeight : null;

  // 記録した日数をカウント
  const recordedDays = await db
    .select({
      count: sql<number>`count(distinct ${mealLogs.date})`,
    })
    .from(mealLogs)
    .where(
      and(
        eq(mealLogs.userId, userId),
        gte(mealLogs.date, startDate),
        lte(mealLogs.date, endDate)
      )
    );

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">週次振り返り</h1>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ダッシュボードへ
        </Link>
      </div>

      <p className="text-sm text-zinc-500 mb-6">
        {startDate} 〜 {endDate} の振り返り
      </p>

      {/* 記録の継続率 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">記録の継続</h2>
        <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-3xl font-bold">
            {recordedDays[0].count}
            <span className="text-base font-normal text-zinc-500">/ 7日</span>
          </p>
          <p className="text-sm text-zinc-500 mt-1">食事を記録した日数</p>
        </div>
      </section>

      {/* 体重の変化 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">体重の変化</h2>
        <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          {weightChange !== null ? (
            <>
              <p className="text-3xl font-bold">
                {weightChange > 0 ? "+" : ""}
                {weightChange.toFixed(1)}
                <span className="text-base font-normal text-zinc-500">kg</span>
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                {firstWeight?.toFixed(1)}kg → {lastWeight?.toFixed(1)}kg
                {goal && (
                  <span>（目標 {goal.targetWeightKg}kg）</span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-400">体重の記録がありません</p>
          )}
        </div>
      </section>

      {/* 食事の概要 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">食事の概要</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">平均カロリー/日</p>
            <p className="text-xl font-bold mt-1">
              {recordedDays[0].count > 0
                ? Math.round(meals.totalCalories / recordedDays[0].count)
                : 0}
              <span className="text-xs font-normal">kcal</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">食事回数</p>
            <p className="text-xl font-bold mt-1">{meals.mealCount}回</p>
          </div>
        </div>
      </section>

      {/* 活動の概要 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">活動の概要</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">合計運動時間</p>
            <p className="text-xl font-bold mt-1">
              {activities.totalMinutes}
              <span className="text-xs font-normal">分</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">消費カロリー</p>
            <p className="text-xl font-bold mt-1">
              {activities.totalCaloriesBurned}
              <span className="text-xs font-normal">kcal</span>
            </p>
          </div>
        </div>
      </section>

      {/* 分析へのリンク */}
      <Link
        href="/analysis"
        className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white text-center transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        詳しい原因分析を見る
      </Link>
    </div>
  );
}
