/** Minimal user info the UI needs from the session (populated by Auth.js in Phase 3). */
export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}
