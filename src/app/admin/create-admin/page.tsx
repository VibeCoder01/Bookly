'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  createSecondaryAdmin,
  listSecondaryAdmins,
  deleteSecondaryAdmin,
  updateSecondaryAdminPassword,
  renameSecondaryAdmin,
  getCurrentAdmin,
} from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import type { AdminUser } from '@/types';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
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
        <CardTitle className="font-headline text-2xl text-primary mt-2">Manage Secondary Admins</CardTitle>
        <CardDescription>Rename, reset passwords or delete secondary admin accounts.</CardDescription>
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
        {admins.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Rename</TableHead>
                <TableHead>Reset Password</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(a => (
                <TableRow key={a.username}>
                  <TableCell className="font-medium">{a.username}</TableCell>
                  <TableCell>
                    <form action={renameSecondaryAdmin} className="flex gap-2 items-center">
                      <input type="hidden" name="oldUsername" value={a.username} />
                      <Input name="newUsername" placeholder="New Username" className="w-40" required />
                      <SubmitButton label="Rename" />
                    </form>
                  </TableCell>
                  <TableCell>
                    <form action={updateSecondaryAdminPassword} className="flex gap-2 items-center">
                      <input type="hidden" name="username" value={a.username} />
                      <Input name="password" type="password" placeholder="New Password" className="w-40" required minLength={8} />
                      <Input name="confirmPassword" type="password" placeholder="Confirm" className="w-40" required />
                      <SubmitButton label="Reset" />
                    </form>
                  </TableCell>
                  <TableCell>
                    <form action={deleteSecondaryAdmin}>
                      <input type="hidden" name="username" value={a.username} />
                      <Button type="submit" size="sm" variant="destructive">Delete</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="space-y-4">
          <h4 className="font-medium">Add Admin</h4>
          <form action={createSecondaryAdmin} className="space-y-2">
            <Input name="username" placeholder="Username" required />
            <Input name="password" type="password" placeholder="Password" required minLength={8} />
            <Input name="confirmPassword" type="password" placeholder="Confirm Password" required />
            <SubmitButton label="Add Admin" />
          </form>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="link" className="text-muted-foreground">
          <Link href="/admin">Back to Admin Dashboard</Link>
        </Button>
      </CardFooter>
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
