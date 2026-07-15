import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Revenue, users, CMS, and monitoring dashboards land in Phase 7.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Access confirmed</CardTitle>
          <CardDescription>
            You&apos;re signed in with an ADMIN or SUPER_ADMIN role — RBAC is working.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
