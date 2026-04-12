import { auth } from "@/auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { goals, mealLogs, weightLogs, activityLogs, profiles } from "@/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { analyzeWeeklyData } from "@/lib/analysis";
import { WeightMiniChart } from "./weight-mini-chart";
import { DashboardClient } from "./dashboard-client";
import { AppShell } from "../components/app-shell";
import { jstToday, jstDaysAgo } from "@/lib/date";

export default async function DashboardPage({
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

  // 生年月日が未登録なら関所ページへ誘導（既存ユーザーの移行用）
  const profileRows = await db
    .select({ birthDate: profiles.birthDate })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (profileRows.length === 0) redirect("/profile");
  if (!profileRows[0].birthDate) redirect("/onboarding/birthdate");

  // 目標を取得
  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));
  const goal = goalRows.length > 0 ? goalRows[0] : null;

  const sp = await searchParams;
  const today = jstToday();
  const selectedDate = sp.date ?? today;
  const isToday = selectedDate === today;

  // 選択日の食事記録を集計
  const selectedDayMeals = await db
    .select({
      totalCalories: sql<number>`coalesce(sum(${mealLogs.calories}), 0)`,
      totalProtein: sql<number>`coalesce(sum(${mealLogs.proteinGrams}), 0)`,
      totalFat: sql<number>`coalesce(sum(${mealLogs.fatGrams}), 0)`,
      totalCarb: sql<number>`coalesce(sum(${mealLogs.carbGrams}), 0)`,
    })
    .from(mealLogs)
    .where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, selectedDate)));

  const meals = selectedDayMeals[0];

  // 選択日の運動消費カロリー
  const selectedDayExercise = await db
    .select({
      totalBurned: sql<number>`coalesce(sum(${activityLogs.caloriesBurned}), 0)`,
    })
    .from(activityLogs)
    .where(
      and(eq(activityLogs.userId, userId), eq(activityLogs.date, selectedDate))
    );

  const exerciseCalories = Number(selectedDayExercise[0]?.totalBurned ?? 0);

  // 直近14日間の体重記録
  const fourteenDaysAgoStr = jstDaysAgo(14);
  const recentWeights = await db
    .select()
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        gte(weightLogs.date, fourteenDaysAgoStr)
      )
    )
    .orderBy(sql`${weightLogs.date} asc`);

  // 選択日までで一番新しい体重レコード
  const weightsUpToSelected = recentWeights.filter(
    (w) => w.date <= selectedDate
  );
  const lastWeightRow =
    weightsUpToSelected.length > 0
      ? weightsUpToSelected[weightsUpToSelected.length - 1]
      : null;

  const currentWeight = lastWeightRow ? Number(lastWeightRow.weightKg) : null;
  const latestBodyFat =
    lastWeightRow && lastWeightRow.bodyFatPercent
      ? Number(lastWeightRow.bodyFatPercent)
      : null;

  const weightChartData = recentWeights.map((w) => ({
    date: w.date,
    weight: Number(w.weightKg),
  }));

  // 分析サマリ
  const sevenDaysAgoStr = jstDaysAgo(7);

  const recentMeals = await db
    .select({
      date: mealLogs.date,
      totalCalories: sql<number>`coalesce(sum(${mealLogs.calories}), 0)`,
      totalProtein: sql<number>`coalesce(sum(${mealLogs.proteinGrams}), 0)`,
      totalFat: sql<number>`coalesce(sum(${mealLogs.fatGrams}), 0)`,
      totalCarb: sql<number>`coalesce(sum(${mealLogs.carbGrams}), 0)`,
    })
    .from(mealLogs)
    .where(
      and(eq(mealLogs.userId, userId), gte(mealLogs.date, sevenDaysAgoStr))
    )
    .groupBy(mealLogs.date);

  let analysisSummary: { type: string; title: string } | null = null;
  if (goal && recentMeals.length >= 3) {
    const dailyData = recentMeals.map((m) => {
      const day = new Date(m.date).getDay();
      const weightOnDate = recentWeights.find((w) => w.date === m.date);
      return {
        date: m.date,
        calories: Number(m.totalCalories),
        protein: Number(m.totalProtein),
        fat: Number(m.totalFat),
        carb: Number(m.totalCarb),
        weight: weightOnDate ? Number(weightOnDate.weightKg) : null,
        isWeekend: day === 0 || day === 6,
      };
    });
    const results = analyzeWeeklyData(dailyData, {
      dailyCalorieTarget: goal.dailyCalorieTarget!,
      proteinGrams: goal.proteinGrams!,
      fatGrams: goal.fatGrams!,
      carbGrams: goal.carbGrams!,
      targetWeightKg: Number(goal.targetWeightKg),
    });
    if (results.length > 0) {
      analysisSummary = { type: results[0].type, title: results[0].title };
    }
  }

  // goalデータをクライアント用に整形
  const goalData = goal
    ? {
        dailyCalorieTarget: Number(goal.dailyCalorieTarget ?? 0),
        proteinGrams: Number(goal.proteinGrams ?? 0),
        fatGrams: Number(goal.fatGrams ?? 0),
        carbGrams: Number(goal.carbGrams ?? 0),
        targetWeightKg: Number(goal.targetWeightKg),
        targetBodyFatPercent: goal.targetBodyFatPercent
          ? Number(goal.targetBodyFatPercent)
          : null,
      }
    : null;

  return (
    <AppShell>
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-zinc-400 hover:text-zinc-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 日付ナビ + カロリー/PFC/体重タブ */}
      <DashboardClient
        goal={goalData}
        data={{
          totalCalories: Number(meals.totalCalories),
          totalProtein: Number(meals.totalProtein),
          totalFat: Number(meals.totalFat),
          totalCarb: Number(meals.totalCarb),
          exerciseCalories,
          currentWeight,
          currentBodyFat: latestBodyFat,
        }}
        selectedDate={selectedDate}
      />

      {/* 体重推移ミニグラフ */}
      {weightChartData.length >= 2 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-zinc-500 mb-3">
            体重推移（直近14日間）
          </h2>
          <div className="rounded-xl border border-orange-200 p-4 dark:border-zinc-800">
            <WeightMiniChart
              data={weightChartData}
              targetWeight={goal ? Number(goal.targetWeightKg) : undefined}
            />
          </div>
        </section>
      )}

      {/* 分析サマリ */}
      {analysisSummary && (
        <section className="mb-6">
          <Link
            href="/analysis"
            className={`block rounded-xl border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
              analysisSummary.type === "warning"
                ? "border-amber-300 dark:border-amber-800"
                : analysisSummary.type === "success"
                  ? "border-green-300 dark:border-green-800"
                  : "border-orange-200 dark:border-zinc-800"
            }`}
          >
            <p className="text-xs text-zinc-500 mb-1">最新の分析</p>
            <p className="text-sm font-medium">{analysisSummary.title}</p>
            <p className="text-xs text-zinc-400 mt-1">
              タップして詳細を確認 →
            </p>
          </Link>
        </section>
      )}

      {/* クイックアクション */}
      <section>
        <h2 className="text-sm font-medium text-zinc-500 mb-3">記録する</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href={isToday ? "/record/meal" : `/record/meal?date=${selectedDate}`}
            className="rounded-xl border border-orange-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <span className="text-2xl block mb-1">🍽</span>
            <span className="text-xs font-medium">食事</span>
          </Link>
          <Link
            href={isToday ? "/record/weight" : `/record/weight?date=${selectedDate}`}
            className="rounded-xl border border-orange-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <span className="text-2xl block mb-1">⚖️</span>
            <span className="text-xs font-medium">体重</span>
          </Link>
          <Link
            href={
              isToday
                ? "/record/activity"
                : `/record/activity?date=${selectedDate}`
            }
            className="rounded-xl border border-orange-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <span className="text-2xl block mb-1">🏃</span>
            <span className="text-xs font-medium">活動</span>
          </Link>
        </div>
      </section>
    </div>
    </AppShell>
  );
}
