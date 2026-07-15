"use client";

import * as React from "react";
import { Laptop } from "lucide-react";

import { Button } from "@/components/ui/button";
import { revokeDeviceAction } from "@/modules/auth/actions";

interface Device {
  id: string;
  name: string | null;
  ipAddress: string | null;
  lastSeenAt: Date;
  _count: { sessions: number };
}

export function DeviceList({ devices }: { devices: Device[] }) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  if (devices.length === 0) {
    return <p className="text-muted-foreground text-sm">No devices on record.</p>;
  }

  return (
    <ul className="divide-border divide-y">
      {devices.map((device) => (
        <li key={device.id} className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Laptop className="text-muted-foreground size-4" />
            <div>
              <p className="text-sm font-medium">{device.name ?? "Unknown device"}</p>
              <p className="text-muted-foreground text-xs">
                {device.ipAddress ?? "Unknown IP"} · last active{" "}
                {new Date(device.lastSeenAt).toLocaleString()}
                {device._count.sessions === 0 && " · signed out"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingId === device.id}
            onClick={() => {
              setPendingId(device.id);
              startTransition(async () => {
                await revokeDeviceAction(device.id);
                setPendingId(null);
              });
            }}
          >
            Revoke
          </Button>
        </li>
      ))}
    </ul>
  );
}
