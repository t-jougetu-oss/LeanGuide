import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles, goals, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppShell } from "../components/app-shell";

const activityLabels: Record<string, string> = {
  sedentary: "ほぼ運動しない",
  light: "軽い運動（週1〜3回）",
  moderate: "中程度の運動（週3〜5回）",
  active: "激しい運動（週6〜7回）",
  very_active: "非常に激しい運動",
};

const activityMultiplier: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");
  const userId = user.id;

  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));

  if (profileRows.length === 0) redirect("/profile");
  const profile = profileRows[0];

  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));
  const goal = goalRows.length > 0 ? goalRows[0] : null;

  const settingsRows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.userId, userId));
  const settings = settingsRows.length > 0 ? settingsRows[0] : null;

  // 計算値
  const heightCm = Number(profile.heightCm);
  const weightKg = Number(profile.weightKg);
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const standardWeight = 22 * heightM * heightM;
  const bodyFatPercent = profile.bodyFatPercent
    ? Number(profile.bodyFatPercent)
    : null;
  const lbm = bodyFatPercent !== null
    ? weightKg * (1 - bodyFatPercent / 100)
    : null;
  const multiplier = activityMultiplier[profile.activityLevel] ?? 1.55;

  return (
    <AppShell>
      <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">設定</h1>
        </div>

        {/* プロフィール設定 */}
        <Link
          href="/settings/profile"
          className="flex items-center justify-between rounded-xl border border-orange-200 p-4 mb-3 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-foreground"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">&#128100;</span>
            <span className="text-sm font-medium">プロフィール設定</span>
          </div>
          <span className="text-zinc-400">&#8250;</span>
        </Link>

        {/* ボディメイク設定 */}
        <Link
          href="/settings/bodymake"
          className="flex items-center justify-between rounded-xl border border-orange-200 p-4 mb-3 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-foreground"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">&#127947;</span>
            <span className="text-sm font-medium">ボディメイク設定</span>
          </div>
          <span className="text-zinc-400">&#8250;</span>
        </Link>

        {/* リマインダー設定 */}
        <Link
          href="/settings/reminder"
          className="flex items-center justify-between rounded-xl border border-orange-200 p-4 mb-3 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-foreground"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">&#128203;</span>
            <span className="text-sm font-medium">リマインダー設定</span>
          </div>
          <span className="text-zinc-400">&#8250;</span>
        </Link>

        {/* アプリ設定 */}
        <Link
          href="/settings/app"
          className="flex items-center justify-between rounded-xl border border-orange-200 p-4 mb-6 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-foreground"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">&#9881;</span>
            <span className="text-sm font-medium">アプリ設定</span>
          </div>
          <span className="text-zinc-400">&#8250;</span>
        </Link>

        {/* ヘルプ */}
        <Link
          href="/help"
          className="flex items-center justify-between rounded-xl border border-orange-200 p-4 mb-6 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-foreground"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">&#10068;</span>
            <span className="text-sm font-medium">使い方ガイド</span>
          </div>
          <span className="text-zinc-400">&#8250;</span>
        </Link>
      </div>
    </AppShell>
  );
}
