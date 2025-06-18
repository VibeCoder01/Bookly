
import { Header } from '@/components/bookly/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Admin Dashboard</CardTitle>
            <CardDescription>Manage your Bookly application settings and bookings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>Welcome to the Admin Dashboard. More features coming soon!</p>
            <div className="mt-6">
              <Link href="/" passHref>
                <Button variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
