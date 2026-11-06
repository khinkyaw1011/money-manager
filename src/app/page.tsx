import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

/**
 * Entry point: the login form is the first screen.
 * Signed-in users go straight to the dashboard.
 */
export default async function HomePage() {
  redirect((await getSessionUser()) ? "/dashboard" : "/login");
}
