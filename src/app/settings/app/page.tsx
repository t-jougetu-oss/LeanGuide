import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserBySession } from "@/lib/user";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppSettingsForm } from "./app-settings-form";
import { AppShell } from "../../components/app-shell";

export default async function AppSettingPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = await findUserBySession(session.user);
  if (!user) redirect("/profile");
  const userId = user.id;

  const settingsRows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.userId, userId));

  const settings = settingsRows.length > 0 ? settingsRows[0] : null;

  return (
    <AppShell>
      <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <Link
          href="/settings"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          &lt; 戻る
        </Link>

        <AppSettingsForm
          pfcDecimalEnabled={settings?.pfcDecimalEnabled ?? false}
          heightUnit={settings?.heightUnit ?? "cm"}
          weightUnit={settings?.weightUnit ?? "kg"}
          homeCardType={settings?.homeCardType ?? "toggle"}
        />
      </div>
    </AppShell>
  );
}
