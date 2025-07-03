
'use client';

import { useState } from 'react';
import { changeAdminPassword } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await changeAdminPassword(formData);

    if (result.success) {
      setSuccessMessage(result.message || 'Password changed successfully!');
      (event.target as HTMLFormElement).reset();
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }
    setIsSubmitting(false);
  }

  return (
    <main className="container mx-auto py-20 flex justify-center items-center">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl rounded-xl">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl text-primary mt-2">Change Admin Password</CardTitle>
              <CardDescription>Enter your old password and a new one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert variant="default" className="border-green-500 text-green-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
               <Button asChild variant="link" className="text-muted-foreground">
                  <Link href="/admin">Back to Admin Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  );
}
