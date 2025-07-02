
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyAdminPassword } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle, KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <main className="container mx-auto py-20 flex justify-center items-center">
        <div className="w-full max-w-md">
            <form action={verifyAdminPassword}>
                <Card className="shadow-2xl rounded-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                           <KeyRound className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl text-primary mt-2">Admin Access</CardTitle>
                        <CardDescription>Please enter the admin password to continue.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    </main>
  );
}

// Wrapping with Suspense is a good practice when using useSearchParams
// to prevent the entire page from being dynamically rendered.
export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminLoginForm />
        </Suspense>
    )
}
