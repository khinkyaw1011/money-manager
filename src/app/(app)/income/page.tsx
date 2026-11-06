import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LedgerSection } from "@/components/ledger/ledger-section";
import { PayPalActivity } from "@/components/paypal/paypal-activity";
import { PayPalErrorCard } from "@/components/paypal/paypal-error-card";
import { TotalActivityCard } from "@/components/paypal/total-activity-card";
import { RefreshButton } from "@/components/paypal/refresh-button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import type { PayPalActivitySummary, PayPalErrorInfo } from "@/features/paypal/types";
import { getSessionUser } from "@/lib/session";
import {
  getPayPalActivitySummary,
  PayPalIntegrationError,
} from "@/server/integrations/paypal";

export const metadata: Metadata = { title: "Income" };

const DAYS = 90;

export default async function IncomePage() {
  // Authorization lives next to the data read, not only in the layout.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let summary: PayPalActivitySummary | null = null;
  let error: PayPalErrorInfo | null = null;

  try {
    summary = await getPayPalActivitySummary({ days: DAYS });
  } catch (cause) {
    if (cause instanceof PayPalIntegrationError) {
      error = {
        code: cause.code,
        message: cause.message,
        status: cause.status,
        debugId: cause.debugId,
      };
    } else {
      error = {
        code: "API_ERROR",
        message: "Unexpected error while loading PayPal transactions.",
      };
    }
  }

  return (
    <>
      <PageHeader
        title="Income"
        description="Add and manage income. PayPal amounts are converted to JPY."
        actions={
          <>
            <Badge variant="outline">Sandbox</Badge>
            <RefreshButton />
          </>
        }
      />
      <LedgerSection kind="INCOME" />
      <TotalActivityCard
        direction="INCOME"
        paypalTotals={summary?.incomeTotals ?? []}
        days={summary?.days ?? DAYS}
      />
      {error ? (
        <PayPalErrorCard error={error} />
      ) : summary ? (
        <PayPalActivity
          direction="INCOME"
          transactions={summary.transactions.filter((t) => t.direction === "INCOME")}
          totals={summary.incomeTotals}
          scanned={summary.scanned}
          days={summary.days}
          showTotals={false}
        />
      ) : null}
    </>
  );
}
