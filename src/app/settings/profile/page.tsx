import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm } from "../profile-form";
import { AppShell } from "../../components/app-shell";

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

export default async function ProfileSettingPage() {
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

  const heightCm = Number(profile.heightCm);
  const weightKg = Number(profile.weightKg);
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const standardWeight = 22 * heightM * heightM;
  const bodyFatPercent = profile.bodyFatPercent
    ? Number(profile.bodyFatPercent)
    : null;
  const lbm =
    bodyFatPercent !== null ? weightKg * (1 - bodyFatPercent / 100) : null;
  const multiplier = activityMultiplier[profile.activityLevel] ?? 1.55;

  return (
    <AppShell>
      <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <Link
          href="/settings"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          &lt; 戻る
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-blue-600">プロフィール</h1>
        </div>

        <div className="rounded-xl border border-orange-200 dark:border-zinc-800 divide-y divide-orange-200 dark:divide-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">身長</span>
            <span className="text-sm font-medium">{heightCm} cm</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">年齢</span>
            <span className="text-sm font-medium">{profile.age} 歳</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">性別</span>
            <span className="text-sm font-medium">
              {profile.gender === "male" ? "男性" : "女性"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">BMI</span>
            <span className="text-sm font-medium">{bmi.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">体重</span>
            <span className="text-sm font-medium">{weightKg} kg</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">標準体重</span>
            <span className="text-sm font-medium">
              {standardWeight.toFixed(1)} kg
            </span>
          </div>
          {lbm !== null && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-500">除脂肪体重 (LBM)</span>
              <span className="text-sm font-medium">{lbm.toFixed(1)} kg</span>
            </div>
          )}
          {bodyFatPercent !== null && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-500">体脂肪率</span>
              <span className="text-sm font-medium">{bodyFatPercent} %</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">活動レベル</span>
            <span className="text-sm font-medium">{multiplier.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">基礎代謝 (BMR)</span>
            <span className="text-sm font-medium">
              {Math.round(Number(profile.bmr))} kcal
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500">総消費カロリー</span>
            <span className="text-sm font-medium">
              {Math.round(Number(profile.tdee))} kcal
            </span>
          </div>
        </div>

        <div className="mt-6">
          <ProfileForm existingProfile={profile} />
        </div>
      </div>
    </AppShell>
  );
}
