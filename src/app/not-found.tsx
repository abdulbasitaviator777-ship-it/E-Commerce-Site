import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        We couldn&apos;t find that page. It might have been moved or doesn&apos;t exist.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/">
          <Button>
            <Home className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}