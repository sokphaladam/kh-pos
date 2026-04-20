"use client";

import { useRouter } from "next/navigation";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background w-full">
      <div className="flex flex-col items-center gap-6 text-center p-8">
        <div className="rounded-full bg-destructive/10 p-6">
          <ShieldX className="h-16 w-16 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">
            You don&apos;t have permission to access this page. Please contact
            your administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </div>
      </div>
    </div>
  );
}
