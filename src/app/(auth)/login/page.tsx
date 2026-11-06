import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertCircle, Info } from "lucide-react";
import { isGoogleConfigured } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle } from "@/features/auth/actions";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

/** Friendly text for Auth.js error codes (?error=...). Never echoes raw input. */
const errorMessages: Record<string, string> = {
  AccessDenied: "Google sign-in was cancelled or your Google email isn't verified.",
  Configuration: "Sign-in is misconfigured on the server. Check the Google OAuth settings.",
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
};
const defaultError = "Something went wrong while signing in. Please try again.";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSessionUser()) redirect("/dashboard");

  const { error } = await searchParams;
  const errorCode = typeof error === "string" ? error : undefined;
  const errorText = errorCode ? (errorMessages[errorCode] ?? defaultError) : null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Logo size={44} className="mx-auto mb-2" />
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Access your accounts, budgets and reports.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorText && (
          <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {errorText}
          </p>
        )}

        <form action={signInWithGoogle}>
          <Button type="submit" variant="outline" className="w-full" disabled={!isGoogleConfigured}>
            <GoogleMark />
            Continue with Google
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        {isGoogleConfigured ? (
          <p className="w-full text-center text-xs text-muted-foreground">
            We only use your Google name, email and profile picture.
          </p>
        ) : (
          <p role="status" className="flex w-full items-start gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Google sign-in isn&apos;t configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to
            .env and restart the dev server.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
