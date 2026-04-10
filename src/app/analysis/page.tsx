import { auth } from "@/auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles, goals, mealLogs, weightLogs, activityLogs } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { analyzeWeeklyData } from "@/lib/analysis";
import { AppShell } from "../components/app-shell";

export default async function AnalysisPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");
  const userId = user.id;

  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  if (goalRows.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-4 py-12">
        <p className="text-zinc-500 mb-4">先に目標を設定してください</p>
        <Link href="/goal" className="text-sm underline">
          目標設定へ
        </Link>
      </div>
    );
  }

  const goal = goalRows[0];

  // 直近7日間のデータ取得
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  // 食事データ（日ごとに集計）
  const mealData = await db
    .select({
      date: mealLogs.date,
      totalCalories: sql<number>`coalesce(sum(${mealLogs.calories}), 0)`,
      totalProtein: sql<number>`coalesce(sum(${mealLogs.proteinGrams}), 0)`,
      totalFat: sql<number>`coalesce(sum(${mealLogs.fatGrams}), 0)`,
      totalCarb: sql<number>`coalesce(sum(${mealLogs.carbGrams}), 0)`,
    })
    .from(mealLogs)
    .where(
      and(
        eq(mealLogs.userId, userId),
        gte(mealLogs.date, startDate),
        lte(mealLogs.date, endDate)
      )
    )
    .groupBy(mealLogs.date);

  // 体重データ
  const weightData = await db
    .select()
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        gte(weightLogs.date, startDate),
        lte(weightLogs.date, endDate)
      )
    );

  // 活動データ
  const activitySummary = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(${activityLogs.durationMinutes}), 0)`,
      totalCaloriesBurned: sql<number>`coalesce(sum(${activityLogs.caloriesBurned}), 0)`,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        gte(activityLogs.date, startDate),
        lte(activityLogs.date, endDate)
      )
    );

  // プロフィールからTDEE取得
  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  const tdee = profileRows.length > 0 ? Number(profileRows[0].tdee) : undefined;

  // 日ごとのデータを統合
  const dailyData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();

    const meal = mealData.find((m) => m.date === dateStr);
    const weight = weightData.find((w) => w.date === dateStr);

    if (meal || weight) {
      dailyData.push({
        date: dateStr,
        calories: meal?.totalCalories ?? 0,
        protein: meal?.totalProtein ?? 0,
        fat: meal?.totalFat ?? 0,
        carb: meal?.totalCarb ?? 0,
        weight: weight ? Number(weight.weightKg) : null,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
  }

  const results = analyzeWeeklyData(
    dailyData,
    {
      dailyCalorieTarget: goal.dailyCalorieTarget ?? 2000,
      proteinGrams: goal.proteinGrams ?? 100,
      fatGrams: goal.fatGrams ?? 55,
      carbGrams: goal.carbGrams ?? 250,
      targetWeightKg: Number(goal.targetWeightKg),
    },
    {
      totalMinutes: activitySummary[0].totalMinutes,
      totalCaloriesBurned: activitySummary[0].totalCaloriesBurned,
    },
    tdee
  );

  const typeStyles = {
    warning:
      "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
    info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
    success:
      "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
  };

  const typeLabels = {
    warning: "注意",
    info: "情報",
    success: "良好",
  };

  return (
    <AppShell>
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">原因分析</h1>
        <p className="text-sm text-zinc-500 mt-2">
          直近7日間（{startDate} 〜 {endDate}）のデータに基づく分析
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {results.map((result, i) => (
          <div
            key={i}
            className={`rounded-xl border p-5 ${typeStyles[result.type]}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">
                {typeLabels[result.type]}
              </span>
              <h3 className="font-medium">{result.title}</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              {result.description}
            </p>
            <p className="text-sm font-medium">{result.action}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-400 mt-6 text-center">
        この分析は一般的な栄養学の知見に基づく参考情報です。医療的な判断ではありません。
      </p>
    </div>
    </AppShell>
  );
}
