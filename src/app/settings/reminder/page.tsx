import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../components/app-shell";

export default async function ReminderSettingPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <AppShell>
      <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <Link
          href="/settings"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          &lt; 戻る
        </Link>

        <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
          <div className="text-6xl mb-6 text-zinc-300">&#9200;</div>
          <h2 className="text-lg font-medium mb-3">
            リマインダーが登録されていません
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed mb-8 max-w-xs">
            毎日決まった時間に食事をしたり、食後一定間隔で間食を摂りたい場合は、通知登録をしてリマインドをしましょう。
          </p>
          <button className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            通知設定をする
          </button>
        </div>
      </div>
    </AppShell>
  );
}
