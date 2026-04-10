import { auth } from "@/auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { weightLogs, mealLogs } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { GraphView } from "./graph-view";
import { AppShell } from "../components/app-shell";
import { jstToday, jstDaysAgo } from "@/lib/date";

export default async function GraphPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");
  const userId = user.id;

  // 直近30日間のデータをデフォルトで取得（JST）
  const startDate = jstDaysAgo(30);
  const endDate = jstToday();

  // 体重データ
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
    .orderBy(sql`${weightLogs.date} asc`);

  // 食事データ（日別集計）
  const meals = await db
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
    .groupBy(mealLogs.date)
    .orderBy(sql`${mealLogs.date} asc`);

  const weightData = weights.map((w) => ({
    date: w.date,
    weight: Number(w.weightKg),
    bodyFatPercent: w.bodyFatPercent ? Number(w.bodyFatPercent) : null,
  }));

  const mealData = meals.map((m) => ({
    date: m.date,
    calories: m.totalCalories,
    protein: m.totalProtein,
    fat: m.totalFat,
    carb: m.totalCarb,
  }));

  return (
    <AppShell>
      <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">グラフ</h1>
        <GraphView
          weightData={weightData}
          mealData={mealData}
          defaultStartDate={startDate}
          defaultEndDate={endDate}
        />
      </div>
    </AppShell>
  );
}
