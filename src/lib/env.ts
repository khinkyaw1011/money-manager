import "server-only";
import { z } from "zod";

/**
 * Server-side environment variables, validated with Zod.
 *
 * - `server-only` makes the build fail if this module is ever imported
 *   from a Client Component, so secrets can't leak into the browser bundle.
 * - Parsing is lazy (first call to `env()`), so pages that don't need the
 *   database can still render before Phase 2/3 values are configured.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Phase 2 – PostgreSQL (Neon / Supabase). Pooled URL for the app,
  // direct URL for Prisma migrations.
  DATABASE_URL: z.url().startsWith("postgres"),
  DIRECT_URL: z.url().startsWith("postgres"),

  // Phase 3 – Auth.js. Generate with `npx auth secret` or `openssl rand -base64 32`.
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  GOOGLE_CLIENT_ID: z.string().optional(), // empty = Google sign-in disabled
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Phase 7 – AES-256-GCM key for provider tokens (32 bytes, base64).
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .refine(
      (v) => Buffer.from(v, "base64").length === 32,
      "TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded",
    )
    .optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * PayPal REST app credentials. Kept separate from `serverEnvSchema` so the
 * PayPal integration can load even before the database (Phase 2) exists.
 */
const paypalEnvSchema = z.object({
  PAYPAL_CLIENT_ID: z.string().min(1, "PAYPAL_CLIENT_ID is required"),
  PAYPAL_CLIENT_SECRET: z.string().min(1, "PAYPAL_CLIENT_SECRET is required"),
  PAYPAL_ENV: z.enum(["sandbox", "live"]).default("sandbox"),
});

export interface PayPalEnv {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "live";
}

let cachedPaypal: PayPalEnv | undefined;

export function paypalEnv(): PayPalEnv {
  if (cachedPaypal) return cachedPaypal;
  const parsed = paypalEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Invalid PayPal environment variables: ${issues}`);
  }
  cachedPaypal = {
    clientId: parsed.data.PAYPAL_CLIENT_ID,
    clientSecret: parsed.data.PAYPAL_CLIENT_SECRET,
    environment: parsed.data.PAYPAL_ENV,
  };
  return cachedPaypal;
}

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // Never print the values themselves — only which keys are wrong.
    throw new Error(`Invalid server environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
