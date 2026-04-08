import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users, goals, mealLogs, weightLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

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

  // 最新の体重記録
  const latestWeight = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(sql`${weightLogs.date} desc`)
    .limit(1);

  const currentWeight =
    latestWeight.length > 0 ? Number(latestWeight[0].weightKg) : null;

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            設定
          </Link>
          <p className="text-sm text-zinc-500">{session.user.name}</p>
        </div>
      </div>

      {/* 今日の概要 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">今日の概要</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">摂取カロリー</p>
            <p className="text-2xl font-bold mt-1">
              {meals.totalCalories}
              <span className="text-sm font-normal">kcal</span>
            </p>
            <p className="text-xs text-zinc-400">
              / 目標 {goal?.dailyCalorieTarget ?? "---"}kcal
            </p>
          </div>
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

      {/* PFCバランス */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">
          今日のPFCバランス
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-500">タンパク質</p>
            <p className="text-xl font-bold mt-1">{meals.totalProtein}g</p>
            <p className="text-xs text-zinc-400">
              / {goal?.proteinGrams ?? "---"}g
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-500">脂質</p>
            <p className="text-xl font-bold mt-1">{meals.totalFat}g</p>
            <p className="text-xs text-zinc-400">
              / {goal?.fatGrams ?? "---"}g
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-500">炭水化物</p>
            <p className="text-xl font-bold mt-1">{meals.totalCarb}g</p>
            <p className="text-xs text-zinc-400">
              / {goal?.carbGrams ?? "---"}g
            </p>
          </div>
        </div>
      </section>

      {/* 原因分析（後で実装） */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">原因分析</h2>
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
          データが蓄積されると、ここに分析結果が表示されます
        </div>
      </section>

      {/* クイックアクション */}
      <section>
        <h2 className="text-sm font-medium text-zinc-500 mb-3">記録する</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/record/meal"
            className="rounded-xl border border-zinc-200 p-4 text-center text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            食事
          </Link>
          <Link
            href="/record/weight"
            className="rounded-xl border border-zinc-200 p-4 text-center text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            体重
          </Link>
          <Link
            href="/record/activity"
            className="rounded-xl border border-zinc-200 p-4 text-center text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            活動
          </Link>
        </div>
      </section>
    </div>
  );
}
