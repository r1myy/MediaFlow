import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";
import type { Entitlements } from "@/modules/subscription/entitlements";

function pct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

export function UsageCard({ entitlements: e }: { entitlements: Entitlements }) {
  const storageUsed = Number(e.usage.storageBytesUsed);
  const storageTotal = Number(e.plan.maxStorageBytes);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current usage</CardTitle>
          {e.status === "TRIALING" && e.trialDaysRemaining !== null && (
            <Badge variant={e.isTrialExpired ? "destructive" : "secondary"}>
              {e.isTrialExpired
                ? "Trial expired"
                : `${e.trialDaysRemaining} day(s) left in trial`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span>Uploads today</span>
            <span className="text-muted-foreground">
              {e.usage.uploadsToday}
              {e.plan.maxUploadsPerDay === null ? "" : ` / ${e.plan.maxUploadsPerDay}`}
            </span>
          </div>
          {e.plan.maxUploadsPerDay !== null && (
            <Progress value={pct(e.usage.uploadsToday, e.plan.maxUploadsPerDay)} />
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span>Storage</span>
            <span className="text-muted-foreground">
              {formatBytes(e.usage.storageBytesUsed)} /{" "}
              {formatBytes(e.plan.maxStorageBytes)}
            </span>
          </div>
          <Progress value={pct(storageUsed, storageTotal)} />
        </div>

        <div className="flex justify-between text-sm">
          <span>Simultaneous jobs</span>
          <span className="text-muted-foreground">
            {e.usage.activeJobs} / {e.plan.maxSimultaneousJobs}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
