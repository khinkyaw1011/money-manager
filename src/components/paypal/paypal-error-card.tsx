import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PayPalErrorInfo } from "@/features/paypal/types";

export function PayPalErrorCard({ error }: { error: PayPalErrorInfo }) {
  const unauthorized = error.code === "NOT_AUTHORIZED";
  const notConfigured = error.code === "NOT_CONFIGURED";

  return (
    <Card className="border-warning/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-warning" aria-hidden />
          PayPal transactions unavailable
        </CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {notConfigured && (
          <p className="text-muted-foreground">
            Add <code className="rounded bg-muted px-1 py-0.5">PAYPAL_CLIENT_ID</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5">PAYPAL_CLIENT_SECRET</code> to{" "}
            <code className="rounded bg-muted px-1 py-0.5">.env</code>, then restart the dev server.
          </p>
        )}

        {unauthorized && (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Open the PayPal Developer Dashboard and switch to Sandbox.</li>
              <li>Open the REST app whose credentials are in .env.</li>
              <li>
                Enable <strong>Transaction Search</strong> in the App Settings and save.
              </li>
              <li>Return here and press Refresh. Old PayPal tokens are discarded automatically.</li>
            </ol>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://developer.paypal.com/dashboard/applications/sandbox"
                target="_blank"
                rel="noreferrer"
              >
                Open PayPal sandbox apps
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </Button>
          </>
        )}

        {(error.status || error.debugId) && (
          <p className="text-xs text-muted-foreground">
            {error.status ? `HTTP ${error.status}` : null}
            {error.status && error.debugId ? " · " : null}
            {error.debugId ? `debug id ${error.debugId}` : null}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
