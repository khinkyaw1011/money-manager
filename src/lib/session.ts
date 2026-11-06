import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import type { SessionUser } from "@/types/user";

/**
 * Current signed-in user, or null when signed out.
 * Wrapped in React `cache` so layout + header share one lookup per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;
  return { id: user.id, name: user.name ?? null, email: user.email, image: user.image ?? null };
});
