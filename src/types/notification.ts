/** Mirrors the Notification table planned for Phase 2. */
export type NotificationType =
  | "BUDGET_WARNING"
  | "BUDGET_EXCEEDED"
  | "GOAL_REACHED"
  | "CONNECTION"
  | "SYSTEM";

/** Serializable shape passed from Server to Client Components. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** Optional in-app link, e.g. "/budgets". */
  href?: string;
}
