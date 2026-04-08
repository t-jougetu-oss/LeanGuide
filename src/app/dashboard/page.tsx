import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users, goals, mealLogs, weightLogs } from "@/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { analyzeWeeklyData } from "@/lib/analysis";
import { WeightMiniChart } from "./weight-mini-chart";
import { AppShell } from "../components/app-shell";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  if (userRows.length === 0) redirect("/profile");
  const userId = userRows[0].id;

  // 目標を取得
  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));
  const goal = goalRows.length > 0 ? goalRows[0] : null;

  // 今日の日付
  const today = new Date().toISOString().split("T")[0];

  // 今日の食事記録を集計
  const todayMeals = await db
    .select({
      totalCalories: sql<number>`coalesce(sum(${mealLogs.calories}), 0)`,
      totalProtein: sql<number>`coalesce(sum(${mealLogs.proteinGrams}), 0)`,
      totalFat: sql<number>`coalesce(sum(${mealLogs.fatGrams}), 0)`,
      totalCarb: sql<number>`coalesce(sum(${mealLogs.carbGrams}), 0)`,
    })
    .from(mealLogs)
    .where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, today)));

  const meals = todayMeals[0];

  // 直近14日間の体重記録（7日間移動平均の計算に必要）
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentWeights = await db
    .select()
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        gte(weightLogs.date, fourteenDaysAgo.toISOString().split("T")[0])
      )
    )
    .orderBy(sql`${weightLogs.date} asc`);

  const currentWeight =
    recentWeights.length > 0
      ? Number(recentWeights[recentWeights.length - 1].weightKg)
      : null;

  // 体重データをチャート用に変換
  const weightChartData = recentWeights.map((w) => ({
    date: w.date,
    weight: Number(w.weightKg),
  }));

  // 直近7日間の食事データで分析サマリを取得
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

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

  // 分析サマリを生成
  let analysisSummary: { type: string; title: string } | null = null;
  if (goal && recentMeals.length >= 3) {
    const dailyData = recentMeals.map((m) => {
      const day = new Date(m.date).getDay();
      const weightOnDate = recentWeights.find((w) => w.date === m.date);
      return {
        date: m.date,
        calories: m.totalCalories,
        protein: m.totalProtein,
        fat: m.totalFat,
        carb: m.totalCarb,
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

  // プログレス計算
  const caloriePercent = goal?.dailyCalorieTarget
    ? Math.min(
        Math.round((meals.totalCalories / goal.dailyCalorieTarget) * 100),
        100
      )
    : 0;

  const pfcData = goal
    ? [
        {
          label: "P",
          current: meals.totalProtein,
          target: goal.proteinGrams ?? 0,
          color: "bg-blue-500",
        },
        {
          label: "F",
          current: meals.totalFat,
          target: goal.fatGrams ?? 0,
          color: "bg-amber-500",
        },
        {
          label: "C",
          current: meals.totalCarb,
          target: goal.carbGrams ?? 0,
          color: "bg-green-500",
        },
      ]
    : [];

  return (
    <AppShell>
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-zinc-500">{session.user.name}</p>
      </div>

      {/* 今日の概要 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">今日の概要</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* カロリー（プログレスバー付き） */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">摂取カロリー</p>
            <p className="text-2xl font-bold mt-1">
              {meals.totalCalories}
              <span className="text-sm font-normal">kcal</span>
            </p>
            <p className="text-xs text-zinc-400 mb-2">
              / 目標 {goal?.dailyCalorieTarget ?? "---"}kcal
            </p>
            {goal?.dailyCalorieTarget && (
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    meals.totalCalories > goal.dailyCalorieTarget
                      ? "bg-red-500"
                      : caloriePercent >= 80
                        ? "bg-amber-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min((meals.totalCalories / goal.dailyCalorieTarget) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* 体重 */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">最新の体重</p>
            <p className="text-2xl font-bold mt-1">
              {currentWeight ?? "---"}
              <span className="text-sm font-normal">kg</span>
            </p>
            <p className="text-xs text-zinc-400">
              目標 {goal?.targetWeightKg ?? "---"}kg
            </p>
          </div>
        </div>
      </section>

      {/* PFCバランス（棒グラフ風） */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">
          今日のPFCバランス
        </h2>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-col gap-3">
            {pfcData.map((pfc) => {
              const percent = pfc.target
                ? Math.min(Math.round((pfc.current / pfc.target) * 100), 100)
                : 0;
              const isOver = pfc.target ? pfc.current > pfc.target : false;
              return (
                <div key={pfc.label} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-6 text-zinc-500">
                    {pfc.label}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : pfc.color}`}
                      style={{
                        width: `${Math.min((pfc.current / (pfc.target || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-24 text-right">
                    {pfc.current}g / {pfc.target}g
                  </span>
                </div>
              );
            })}
          </div>
          {pfcData.length === 0 && (
            <p className="text-sm text-zinc-400 text-center">
              目標を設定すると表示されます
            </p>
          )}
        </div>
      </section>

      {/* 体重推移ミニグラフ */}
      {weightChartData.length >= 2 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-zinc-500 mb-3">
            体重推移（直近14日間）
          </h2>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
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
                  : "border-zinc-200 dark:border-zinc-800"
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
            href="/record/meal"
            className="rounded-xl border border-zinc-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <span className="text-2xl block mb-1">🍽</span>
            <span className="text-xs font-medium">食事</span>
          </Link>
          <Link
            href="/record/weight"
            className="rounded-xl border border-zinc-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <span className="text-2xl block mb-1">⚖️</span>
            <span className="text-xs font-medium">体重</span>
          </Link>
          <Link
            href="/record/activity"
            className="rounded-xl border border-zinc-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
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
