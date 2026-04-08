import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users, profiles, goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm } from "./profile-form";
import { GoalForm } from "./goal-form";

const activityLabels: Record<string, string> = {
  sedentary: "ほぼ運動しない",
  light: "軽い運動（週1〜3回）",
  moderate: "中程度の運動（週3〜5回）",
  active: "激しい運動（週6〜7回）",
  very_active: "非常に激しい運動",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  if (userRows.length === 0) redirect("/profile");
  const userId = userRows[0].id;

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

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">設定</h1>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ダッシュボードに戻る
        </Link>
      </div>

      {/* アカウント情報 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">
          アカウント情報
        </h2>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{session.user.name}</p>
              <p className="text-sm text-zinc-500">{session.user.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* プロフィール */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">
          プロフィール
        </h2>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">性別</p>
              <p className="font-medium">
                {profile.gender === "male" ? "男性" : "女性"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">年齢</p>
              <p className="font-medium">{profile.age}歳</p>
            </div>
            <div>
              <p className="text-zinc-500">身長</p>
              <p className="font-medium">{profile.heightCm}cm</p>
            </div>
            <div>
              <p className="text-zinc-500">体重</p>
              <p className="font-medium">{profile.weightKg}kg</p>
            </div>
            <div>
              <p className="text-zinc-500">活動レベル</p>
              <p className="font-medium">
                {activityLabels[profile.activityLevel] ?? profile.activityLevel}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">基礎代謝 / TDEE</p>
              <p className="font-medium">
                {Math.round(Number(profile.bmr))}kcal /{" "}
                {Math.round(Number(profile.tdee))}kcal
              </p>
            </div>
          </div>
          <ProfileForm existingProfile={profile} />
        </div>
      </section>

      {/* 目標設定 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">目標設定</h2>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          {goal ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">目標体重</p>
                  <p className="font-medium">{goal.targetWeightKg}kg</p>
                </div>
                <div>
                  <p className="text-zinc-500">達成期限</p>
                  <p className="font-medium">{goal.targetDate}</p>
                </div>
                <div>
                  <p className="text-zinc-500">1日の目標カロリー</p>
                  <p className="font-medium">{goal.dailyCalorieTarget}kcal</p>
                </div>
                <div>
                  <p className="text-zinc-500">目標PFC</p>
                  <p className="font-medium">
                    P:{goal.proteinGrams}g / F:{goal.fatGrams}g / C:
                    {goal.carbGrams}g
                  </p>
                </div>
              </div>
              <GoalForm
                currentWeightKg={Number(profile.weightKg)}
                tdee={Number(profile.tdee)}
                existingGoal={goal}
              />
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-500 mb-3">
                目標がまだ設定されていません
              </p>
              <Link
                href="/goal"
                className="inline-block rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                目標を設定する
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
