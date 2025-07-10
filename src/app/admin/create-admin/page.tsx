'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  createSecondaryAdmin,
  listSecondaryAdmins,
  deleteSecondaryAdmin,
  updateSecondaryAdminPassword,
  getCurrentAdmin,
} from '@/lib/actions';
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
  const [currentAdmin, setCurrentAdmin] = useState<{username: string; isPrimary: boolean} | null>(null);
  useEffect(() => {
    listSecondaryAdmins().then(setAdmins).catch(() => setAdmins([]));
    getCurrentAdmin().then(setCurrentAdmin).catch(() => setCurrentAdmin(null));
  }, []);

  if (currentAdmin && !currentAdmin.isPrimary) {
    return (
      <Card className="shadow-2xl rounded-xl">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Only the primary admin can manage secondary admins.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="link">
            <Link href="/admin">Back to Admin Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-2xl rounded-xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl text-primary mt-2">Create Secondary Admin</CardTitle>
        <CardDescription>Provide a username and password along with the primary admin password.</CardDescription>
      </CardHeader>
      <form action={createSecondaryAdmin}>
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href="/admin">Back to Admin Dashboard</Link>
          </Button>
        </CardFooter>
      </form>
      {admins.length > 0 && (
        <CardContent>
          <p className="text-sm font-medium mb-2">Existing Secondary Admins</p>
          <ul className="space-y-4">
            {admins.map(a => (
              <li key={a.username} className="border rounded p-2">
                <p className="font-medium mb-2">{a.username}</p>
                <form action={updateSecondaryAdminPassword} className="space-y-2">
                  <input type="hidden" name="username" value={a.username} />
                  <Input name="password" type="password" placeholder="New Password" required minLength={8} />
                  <Input name="confirmPassword" type="password" placeholder="Confirm Password" required />
                  <Input name="primaryPassword" type="password" placeholder="Primary Admin Password" required />
                  <Button type="submit" size="sm">Update Password</Button>
                </form>
                <form action={deleteSecondaryAdmin} className="mt-2 space-y-2">
                  <input type="hidden" name="username" value={a.username} />
                  <Input name="primaryPassword" type="password" placeholder="Primary Admin Password" required />
                  <Button type="submit" size="sm" variant="destructive">Delete</Button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
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
