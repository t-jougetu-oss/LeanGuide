import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const session = await auth();

  // ログイン済み+プロフィール登録済みなら直接ダッシュボードへ
  if (session?.user) {
    const user = await findUserBySession(session.user);
    if (user) {
      const profileRows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, user.id));
      if (profileRows.length > 0) {
        redirect("/dashboard");
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-1 w-full max-w-md flex-col items-center justify-center px-6 py-20 text-center">
        {/* ロゴ */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">LeanGuide</h1>

        <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          痩せない原因を見つけて、
          <br />
          次の一歩を示すダイエット支援アプリ
        </p>

        {/* 特徴 */}
        <div className="mt-8 w-full grid gap-3">
          {[
            { icon: "📊", text: "データから原因を分析" },
            { icon: "💡", text: "具体的な改善アクションを提案" },
            { icon: "📈", text: "7日間移動平均で正しく評価" },
          ].map((feature) => (
            <div
              key={feature.text}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-left dark:border-zinc-800"
            >
              <span className="text-xl">{feature.icon}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 w-full">
          {session?.user ? (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/dashboard"
                className="w-full rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                ダッシュボードへ
              </Link>
              <p className="text-xs text-zinc-400">
                {session.user.name} でログイン中
              </p>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-zinc-400 underline hover:text-zinc-600"
                >
                  ログアウト
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white text-center transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 block"
            >
              ログイン / 新規登録
            </Link>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-400">
          無料で利用できます
        </p>
      </main>
    </div>
  );
}
