import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  // 既存プロフィールを取得
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  let existingProfile = null;
  if (userRows.length > 0) {
    const profileRows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userRows[0].id));
    if (profileRows.length > 0) {
      existingProfile = profileRows[0];
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">
          プロフィール登録
        </h1>
        <ProfileForm existingProfile={existingProfile} />
      </div>
    </div>
  );
}
