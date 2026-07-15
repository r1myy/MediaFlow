import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your media library is coming in Phase 6. For now, manage your account below.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your profile, password, two-factor authentication, and signed-in
            devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Go to <span className="text-foreground font-medium">Settings</span> in the top
          bar.
        </CardContent>
      </Card>
    </div>
  );
}
