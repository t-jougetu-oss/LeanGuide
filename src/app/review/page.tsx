import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { goals, mealLogs, weightLogs, activityLogs } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { AppShell } from "../components/app-shell";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");
  const userId = user.id;

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

  const daysCount = recordedDays[0].count;
  const continuityPercent = Math.round((daysCount / 7) * 100);

  // 平均PFC
  const avgCalories =
    daysCount > 0 ? Math.round(meals.totalCalories / daysCount) : 0;
  const avgProtein =
    daysCount > 0 ? Math.round(meals.totalProtein / daysCount) : 0;
  const avgFat =
    daysCount > 0 ? Math.round(meals.totalFat / daysCount) : 0;
  const avgCarb =
    daysCount > 0 ? Math.round(meals.totalCarb / daysCount) : 0;

  // 目標との比較
  const calorieVsGoal =
    goal?.dailyCalorieTarget && avgCalories > 0
      ? Math.round(
          ((avgCalories - goal.dailyCalorieTarget) / goal.dailyCalorieTarget) *
            100
        )
      : null;

  return (
    <AppShell>
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">週次振り返り</h1>
      </div>

      <p className="text-sm text-zinc-500 mb-6">
        {startDate} 〜 {endDate} の振り返り
      </p>

      {/* 記録の継続率 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">記録の継続</h2>
        <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-3xl font-bold">
            {daysCount}
            <span className="text-base font-normal text-zinc-500">/ 7日</span>
          </p>
          <p className="text-sm text-zinc-500 mt-1">食事を記録した日数</p>
          <div className="mt-3 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                continuityPercent >= 80
                  ? "bg-green-500"
                  : continuityPercent >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${continuityPercent}%` }}
            />
          </div>
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
                {goal && <span>（目標 {goal.targetWeightKg}kg）</span>}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-400">体重の記録がありません</p>
          )}
        </div>
      </section>

      {/* 食事の概要（目標比較付き） */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">食事の概要</h2>
        <div className="rounded-xl border border-zinc-200 p-4 mb-3 dark:border-zinc-800">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-zinc-500">平均カロリー/日</p>
              <p className="text-2xl font-bold mt-1">
                {avgCalories}
                <span className="text-sm font-normal">kcal</span>
              </p>
            </div>
            {calorieVsGoal !== null && (
              <span
                className={`text-sm font-medium ${
                  calorieVsGoal > 10
                    ? "text-red-500"
                    : calorieVsGoal > 0
                      ? "text-amber-500"
                      : "text-green-500"
                }`}
              >
                目標比 {calorieVsGoal > 0 ? "+" : ""}
                {calorieVsGoal}%
              </span>
            )}
          </div>
          {goal?.dailyCalorieTarget && (
            <p className="text-xs text-zinc-400 mt-1">
              目標 {goal.dailyCalorieTarget}kcal/日
            </p>
          )}
        </div>

        {/* 平均PFC */}
        {daysCount > 0 && (
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3">平均PFCバランス/日</p>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "P（タンパク質）",
                  current: avgProtein,
                  target: goal?.proteinGrams,
                  color: "bg-blue-500",
                },
                {
                  label: "F（脂質）",
                  current: avgFat,
                  target: goal?.fatGrams,
                  color: "bg-amber-500",
                },
                {
                  label: "C（炭水化物）",
                  current: avgCarb,
                  target: goal?.carbGrams,
                  color: "bg-green-500",
                },
              ].map((pfc) => {
                const target = pfc.target ?? 0;
                const isOver = target > 0 && pfc.current > target;
                return (
                  <div key={pfc.label} className="flex items-center gap-3">
                    <span className="text-xs w-24 text-zinc-500">
                      {pfc.label}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? "bg-red-500" : pfc.color}`}
                        style={{
                          width: `${Math.min((pfc.current / (target || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-20 text-right">
                      {pfc.current}g / {target}g
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">食事回数</p>
          <p className="text-xl font-bold mt-1">{meals.mealCount}回</p>
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
    </AppShell>
  );
}
