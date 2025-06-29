
import { AdminDashboard } from '@/components/bookly/AdminDashboard';
import { getSession } from '@/lib/session';
import type { SessionPayload } from '@/types';
import { Header } from '@/components/bookly/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default async function AdminPage() {
  const session: SessionPayload | null = await getSession();

  // The middleware should prevent unauthenticated access, but this provides a fallback UI
  // in case the user reaches this page without a valid session.
  if (!session) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <Card className="shadow-xl rounded-xl">
            <CardHeader>
              <CardTitle className="font-headline text-3xl text-primary">Admin Dashboard</CardTitle>
              <CardDescription>Session not found or expired. Please log in.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login" className={cn(buttonVariants({ variant: 'default' }))}>
                Go to Login
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return <AdminDashboard initialSession={session} />;
}
