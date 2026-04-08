import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          LeanGuide
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          痩せない原因を見つけて、次の一歩を示すダイエット支援アプリ
        </p>

        <div className="mt-8">
          {session?.user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                ログイン中: {session.user.name}
              </p>
              <Link
                href="/profile"
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                プロフィール登録
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-zinc-200 px-6 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  ログアウト
                </button>
              </form>
            </div>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google");
              }}
            >
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Googleでログイン
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
