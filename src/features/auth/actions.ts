"use server";

import { signIn, signOut } from "@/auth";

/** Starts the Google OAuth flow; lands on the dashboard afterwards. */
export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

/** Clears the session cookie and returns to the home page. */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
