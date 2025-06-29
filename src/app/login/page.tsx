'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, CalendarCheck, AlertTriangle } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setGlobalError(null);

    const result = await login(data);

    if (result.success) {
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      const redirectedFrom = searchParams.get('redirectedFrom') || '/admin';
      router.push(redirectedFrom);
      router.refresh(); // Important to refresh server-side state
    } else {
      setGlobalError(result.error || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full max-w-md">
      <div className="flex justify-center items-center gap-4 mb-8">
        <CalendarCheck className="h-14 w-14 text-primary" />
        <div>
          <h1 className="font-headline text-5xl font-semibold text-primary">
            Bookly
          </h1>
          <p className="text-muted-foreground">Admin Portal</p>
        </div>
      </div>
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {globalError && (
                <div className="flex items-center gap-x-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {globalError}
                </div>
              )}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
