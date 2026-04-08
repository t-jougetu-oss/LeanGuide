export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          LeanGuide
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          痩せない原因を見つけて、次の一歩を示すダイエット支援アプリ
        </p>
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          現在開発中です
        </div>
      </main>
    </div>
  );
}
