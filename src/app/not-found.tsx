import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          404 — Page Not Found
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          We couldn&apos;t find the page you were looking for
        </h1>
        <p className="max-w-xl text-muted-foreground">
          The page may have been moved, deleted, or perhaps the URL is incorrect.
          Let&apos;s get you back to the Bookly dashboard where you can browse rooms
          and manage bookings.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Return to dashboard
        </Link>
      </Button>
    </main>
  );
}
