import { auth } from "@/auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { goals, weightLogs } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { WeightForm } from "./weight-form";
import { WeightMiniChart } from "../../dashboard/weight-mini-chart";
import { AppShell } from "../../components/app-shell";
import { RecordTabs } from "../../components/record-tabs";
import { jstDaysAgo } from "@/lib/date";

export default async function WeightRecordPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");
  const userId = user.id;

  // 目標を取得
  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));
  const goal = goalRows.length > 0 ? goalRows[0] : null;

  // 直近14日間の体重記録（JST）
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

  // 直近7日間の一覧用（JST）
  const sevenDaysAgoStr = jstDaysAgo(7);
  const last7 = recentWeights.filter(
    (w) => w.date >= sevenDaysAgoStr
  );

  return (
    <AppShell>
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">記録する</h1>
        <RecordTabs />
        <WeightForm />

        {/* 体重推移グラフ */}
        {chartData.length >= 2 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 mb-3">
              体重推移
            </h2>
            <div className="rounded-xl border border-orange-200 p-4 dark:border-zinc-800">
              <WeightMiniChart
                data={chartData}
                targetWeight={goal ? Number(goal.targetWeightKg) : undefined}
              />
            </div>
          </section>
        )}

        {/* 直近7日間の記録 */}
        {last7.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-medium text-zinc-500 mb-3">
              直近7日間の記録
            </h2>
            <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800">
              {last7
                .slice()
                .reverse()
                .map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm text-zinc-500">
                      {w.date.slice(5)}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{w.weightKg}kg</span>
                      {w.bodyFatPercent && (
                        <span className="text-xs text-zinc-400 ml-2">
                          {w.bodyFatPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </AppShell>
  );
}
