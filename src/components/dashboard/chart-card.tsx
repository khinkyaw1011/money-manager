"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChartCardProps {
  title: string;
  description: string;
  isEmpty: boolean;
  emptyText: string;
  chart: React.ReactNode;
  /** Accessible alternative to the chart. */
  table: React.ReactNode;
}

/** Card wrapper with a Chart / Table switch and a built-in empty state. */
export function ChartCard({ title, description, isEmpty, emptyText, chart, table }: ChartCardProps) {
  return (
    <Card>
      <Tabs defaultValue="chart" className="gap-0">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {!isEmpty && (
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {isEmpty ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
              <BarChart3 className="size-6 text-muted-foreground" aria-hidden />
              <p className="max-w-xs text-sm text-muted-foreground">{emptyText}</p>
            </div>
          ) : (
            <>
              <TabsContent value="chart">{chart}</TabsContent>
              <TabsContent value="table">{table}</TabsContent>
            </>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
}
