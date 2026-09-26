import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex-1 dark:from-[#18181b] dark:to-[#23272f] p-0 md:p-0">
      <section className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground">
              Could not find the requested dashboard resource.
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="default">Return to Dashboard</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
