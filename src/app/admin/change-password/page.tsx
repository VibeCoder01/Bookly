'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCurrentAdminPassword } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('password', password);
    const res = await updateCurrentAdminPassword(formData);
    if (res.success) {
      router.push('/admin');
    } else {
      setError(res.error || 'Failed to update password');
    }
  };

  return (
    <main className="container mx-auto py-20 flex justify-center items-center">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl rounded-xl">
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-2xl text-primary mt-2">Change Password</CardTitle>
              <CardDescription>Enter a new password for your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Change Password</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  );
}
