import { auth } from "@/auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { mealLogs, mealFavorites } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { MealForm } from "./meal-form";
import { MealList } from "./meal-list";
import { AppShell } from "../../components/app-shell";
import { RecordTabs } from "../../components/record-tabs";
import { RecordDateNav } from "../../components/record-date-nav";
import { jstToday } from "@/lib/date";

export default async function MealRecordPage({
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

  const params = await searchParams;
  const today = jstToday();
  const selectedDate = params.date ?? today;
  const isToday = selectedDate === today;

  // お気に入り取得
  const favRows = await db
    .select()
    .from(mealFavorites)
    .where(eq(mealFavorites.userId, userId))
    .orderBy(desc(mealFavorites.createdAt));

  // 選択日の食事記録を取得
  const mealsList = await db
    .select()
    .from(mealLogs)
    .where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, selectedDate)))
    .orderBy(sql`${mealLogs.createdAt} asc`);

  // 合計を計算
  const totals = mealsList.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.proteinGrams ?? 0),
      fat: acc.fat + (m.fatGrams ?? 0),
      carb: acc.carb + (m.carbGrams ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carb: 0 }
  );

  const sectionTitle = isToday
    ? "今日の記録"
    : `${Number(selectedDate.slice(5, 7))}月${Number(selectedDate.slice(8, 10))}日の記録`;

  return (
    <AppShell>
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">記録する</h1>
        <RecordTabs />
        <RecordDateNav selectedDate={selectedDate} />
        <MealForm favorites={favRows} defaultDate={selectedDate} />

        {/* 選択日の記録一覧 */}
        {mealsList.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 mb-3">
              {sectionTitle}
            </h2>

            {/* 合計 */}
            <div className="rounded-xl border border-orange-200 p-4 mb-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">
                {isToday ? "本日の合計" : "この日の合計"}
              </p>
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

            {/* 記録一覧（タップで編集モーダル） */}
            <MealList
              meals={mealsList.map((m) => ({
                id: m.id,
                mealType: m.mealType,
                description: m.description,
                calories: m.calories,
                proteinGrams: m.proteinGrams,
                fatGrams: m.fatGrams,
                carbGrams: m.carbGrams,
                basePortion: m.basePortion,
                portionPercent: m.portionPercent,
                baseCalories: m.baseCalories,
                baseProteinGrams: m.baseProteinGrams,
                baseFatGrams: m.baseFatGrams,
                baseCarbGrams: m.baseCarbGrams,
              }))}
            />
          </section>
        ) : (
          <p className="mt-8 text-center text-xs text-zinc-400">
            {isToday
              ? "今日の記録はまだありません"
              : "この日の記録はありません"}
          </p>
        )}
      </div>
    </div>
    </AppShell>
  );
}
