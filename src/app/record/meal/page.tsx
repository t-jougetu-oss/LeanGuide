import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users, mealLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { MealForm } from "./meal-form";

const mealTypeLabels: Record<string, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export default async function MealRecordPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  if (userRows.length === 0) redirect("/profile");
  const userId = userRows[0].id;

  const today = new Date().toISOString().split("T")[0];

  // 今日の食事記録を取得
  const todayMealsList = await db
    .select()
    .from(mealLogs)
    .where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, today)))
    .orderBy(sql`${mealLogs.createdAt} asc`);

  // 合計を計算
  const totals = todayMealsList.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.proteinGrams ?? 0),
      fat: acc.fat + (m.fatGrams ?? 0),
      carb: acc.carb + (m.carbGrams ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carb: 0 }
  );

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">食事を記録</h1>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            戻る
          </Link>
        </div>

        <MealForm />

        {/* 今日の記録一覧 */}
        {todayMealsList.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 mb-3">
              今日の記録
            </h2>

            {/* 合計 */}
            <div className="rounded-xl border border-zinc-200 p-4 mb-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">本日の合計</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{totals.calories}</p>
                  <p className="text-xs text-zinc-400">kcal</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{totals.protein}</p>
                  <p className="text-xs text-zinc-400">P(g)</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{totals.fat}</p>
                  <p className="text-xs text-zinc-400">F(g)</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{totals.carb}</p>
                  <p className="text-xs text-zinc-400">C(g)</p>
                </div>
              </div>
            </div>

            {/* 記録一覧 */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              {todayMealsList.map((meal) => (
                <div key={meal.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">
                      {mealTypeLabels[meal.mealType] ?? meal.mealType}
                    </span>
                    {meal.calories != null && (
                      <span className="text-xs text-zinc-400">
                        {meal.calories}kcal
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{meal.description}</p>
                  {(meal.proteinGrams != null ||
                    meal.fatGrams != null ||
                    meal.carbGrams != null) && (
                    <p className="text-xs text-zinc-400 mt-1">
                      P:{meal.proteinGrams ?? 0}g / F:{meal.fatGrams ?? 0}g / C:
                      {meal.carbGrams ?? 0}g
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
