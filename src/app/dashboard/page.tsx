import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-zinc-500">{session.user.name}</p>
      </div>

      {/* 今日の概要 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">今日の概要</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">摂取カロリー</p>
            <p className="text-2xl font-bold mt-1">---</p>
            <p className="text-xs text-zinc-400">/ 目標 ---kcal</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">今日の体重</p>
            <p className="text-2xl font-bold mt-1">---</p>
            <p className="text-xs text-zinc-400">目標 ---kg</p>
          </div>
        </div>
      </section>

      {/* PFCバランス */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">PFCバランス</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-500">タンパク質</p>
            <p className="text-xl font-bold mt-1">---g</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-500">脂質</p>
            <p className="text-xl font-bold mt-1">---g</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-500">炭水化物</p>
            <p className="text-xl font-bold mt-1">---g</p>
          </div>
        </div>
      </section>

      {/* 原因分析（後で実装） */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">原因分析</h2>
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
          データが蓄積されると、ここに分析結果が表示されます
        </div>
      </section>

      {/* クイックアクション */}
      <section>
        <h2 className="text-sm font-medium text-zinc-500 mb-3">記録する</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/record/meal"
            className="rounded-xl border border-zinc-200 p-4 text-center text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            食事
          </Link>
          <Link
            href="/record/weight"
            className="rounded-xl border border-zinc-200 p-4 text-center text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            体重
          </Link>
          <Link
            href="/record/activity"
            className="rounded-xl border border-zinc-200 p-4 text-center text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            活動
          </Link>
        </div>
      </section>
    </div>
  );
}
