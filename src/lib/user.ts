import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

/** セッションからDBユーザーを取得 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;
  return findUserBySession(session.user);
}

/** googleId または email でユーザーを検索 */
export async function findUserBySession(sessionUser: { id?: string | null; email?: string | null }) {
  const conditions = [];
  if (sessionUser.id) conditions.push(eq(users.googleId, sessionUser.id));
  if (sessionUser.email) conditions.push(eq(users.email, sessionUser.email));

  if (conditions.length === 0) return null;

  const userRows = await db
    .select()
    .from(users)
    .where(conditions.length === 1 ? conditions[0] : or(...conditions));

  return userRows.length > 0 ? userRows[0] : null;
}
