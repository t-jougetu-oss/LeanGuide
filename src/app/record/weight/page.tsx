import { auth } from "@/auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { goals, weightLogs } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { WeightForm } from "./weight-form";
import { WeightItemList } from "./weight-item";
import { WeightMiniChart } from "../../dashboard/weight-mini-chart";
import { AppShell } from "../../components/app-shell";
import { RecordTabs } from "../../components/record-tabs";
import { RecordDateNav } from "../../components/record-date-nav";
import { jstToday, jstDaysAgo } from "@/lib/date";

export default async function WeightRecordPage({
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

  // 目標を取得
  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));
  const goal = goalRows.length > 0 ? goalRows[0] : null;

  // 直近14日間の体重記録（グラフ用）
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

  const chartData = recentWeights.map((w) => ({
    date: w.date,
    weight: Number(w.weightKg),
  }));

  // 選択日の記録
  const selectedDayWeights = recentWeights.filter(
    (w) => w.date === selectedDate
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
        <WeightForm defaultDate={selectedDate} />

        {/* 体重推移グラフ */}
        {chartData.length >= 2 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 mb-3">
              体重推移（直近14日間）
            </h2>
            <div className="rounded-xl border border-orange-200 p-4 dark:border-zinc-800">
              <WeightMiniChart
                data={chartData}
                targetWeight={goal ? Number(goal.targetWeightKg) : undefined}
              />
            </div>
          </section>
        )}

        {/* 選択日の記録 */}
        <section className="mt-6">
          <h2 className="text-sm font-medium text-zinc-500 mb-3">
            {sectionTitle}
          </h2>
          {selectedDayWeights.length > 0 ? (
            <WeightItemList
              weights={selectedDayWeights.map((w) => ({
                id: w.id,
                date: w.date,
                weightKg: w.weightKg,
                bodyFatPercent: w.bodyFatPercent,
              }))}
            />
          ) : (
            <p className="text-center text-xs text-zinc-400">
              {isToday
                ? "今日の記録はまだありません"
                : "この日の記録はありません"}
            </p>
          )}
        </section>
      </div>
    </div>
    </AppShell>
  );
}
