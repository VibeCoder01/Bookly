'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyUserLogin } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, UserCog } from 'lucide-react';
import Link from 'next/link';

function UserLoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const from = searchParams.get('from') ?? '/book';

  return (
    <main className="container mx-auto py-20 flex justify-center items-center">
      <div className="w-full max-w-md">
        <form action={verifyUserLogin}>
          <input type="hidden" name="from" value={from} />
          <Card className="shadow-2xl rounded-xl">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <UserCog className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl text-primary mt-2">User Login</CardTitle>
              <CardDescription>Sign in to access booking features that require an account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" placeholder="your username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Enter password" required />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">
                Login
              </Button>
              <Button asChild variant="link" className="text-muted-foreground font-normal">
                <Link href="/book">Back to Booking</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  );
}

export default function UserLoginPage() {
  return (
    <Suspense>
      <UserLoginForm />
    </Suspense>
  );
}

