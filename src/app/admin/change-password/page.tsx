
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { changeAdminPassword } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { getCurrentAdmin } from '@/lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Change Password
    </Button>
  );
}

function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');
  const [adminInfo, setAdminInfo] = useState<{ username: string; isPrimary: boolean } | null>(null);

  useEffect(() => {
    getCurrentAdmin()
      .then(setAdminInfo)
      .catch(() => setAdminInfo(null));
  }, []);

  const title = adminInfo?.isPrimary ? 'Change Primary Admin Password' : 'Change Your Password';
  const description = adminInfo?.isPrimary
    ? 'Update credentials for the primary admin account.'
    : adminInfo
      ? `Update the password for ${adminInfo.username}.`
      : 'Enter your old password and a new one.';

  return (
    <form action={changeAdminPassword}>
      <Card className="shadow-2xl rounded-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl text-primary mt-2">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
            <Label htmlFor="oldPassword">Old Password</Label>
            <Input id="oldPassword" name="oldPassword" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
            <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
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

export default function ChangePasswordPage() {
  return (
    <main className="container mx-auto py-20 flex justify-center items-center">
      <div className="w-full max-w-md">
        <Suspense>
          <ChangePasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
