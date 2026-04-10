import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BirthDateOnboardingForm } from "./form";

export default async function BirthDateOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");

  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id));

  if (profileRows.length === 0) redirect("/profile");

  // 既に生年月日が登録済みなら直接ダッシュボードへ
  if (profileRows[0].birthDate) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md min-h-screen flex flex-col">
      <header className="px-6 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="text-sm font-medium text-orange-700">LeanGuide</span>
        </div>
      </header>

      <main className="flex-1 px-6 pt-4 pb-8">
        <h1 className="text-2xl font-bold text-zinc-900 leading-snug">
          生年月日を
          <br />
          教えてください
        </h1>
        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          より正確な基礎代謝・カロリー計算のために、生年月日を一度だけ入力してください。
          <br />
          <span className="text-orange-700 font-medium">
            入力後は二度と表示されません。
          </span>
        </p>

        <BirthDateOnboardingForm />

        <div className="mt-6 flex items-start gap-2 text-xs text-zinc-500">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            これまでの「年齢」入力値は破棄され、生年月日から自動計算されるようになります。
          </span>
        </div>
      </main>
    </div>
  );
}
