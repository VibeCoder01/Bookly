'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSecondaryAdmin, listSecondaryAdmins } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import type { AdminUser } from '@/types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Admin
    </Button>
  );
}

function CreateAdminForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  useEffect(() => {
    listSecondaryAdmins().then(setAdmins).catch(() => setAdmins([]));
  }, []);

  return (
    <form action={createSecondaryAdmin}>
      <Card className="shadow-2xl rounded-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl text-primary mt-2">Create Secondary Admin</CardTitle>
          <CardDescription>Provide a username and password along with the primary admin password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryPassword">Primary Admin Password</Label>
            <Input id="primaryPassword" name="primaryPassword" type="password" required />
          </div>
          {admins.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Existing Secondary Admins</p>
              <ul className="list-disc list-inside text-sm">
                {admins.map(a => (<li key={a.username}>{a.username}</li>))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href="/admin">Back to Admin Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export default function CreateAdminPage() {
  return (
    <main className="container mx-auto py-20 flex justify-center items-center">
      <div className="w-full max-w-md">
        <Suspense>
          <CreateAdminForm />
        </Suspense>
      </div>
    </main>
  );
}
