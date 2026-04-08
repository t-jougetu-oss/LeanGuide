import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id!));

  return userRows.length > 0 ? userRows[0] : null;
}
