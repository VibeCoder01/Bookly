
'use client';

import { useState } from 'react';
import { verifyAdminPassword } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
        setError('Password cannot be empty.');
        return;
    }
    setError('');
    setIsLoading(true);

    // The server action will redirect on success, so the promise will not resolve.
    // If it resolves, it's because an error was returned.
    const result = await verifyAdminPassword(password);

    // This part is only reached on failure. `result` will have an `error` property.
    setError(result.error || 'An unknown error occurred.');
    setIsLoading(false);
  };

  return (
    <main className="container mx-auto py-20 flex justify-center items-center">
        <div className="w-full max-w-md">
            <form onSubmit={handleSubmit}>
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
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
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
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Login
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    </main>
  );
}
