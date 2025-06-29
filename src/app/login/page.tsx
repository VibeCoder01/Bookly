'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, setInitialMasterPassword } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, CalendarCheck, AlertTriangle, KeyRound, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().optional(), // Can be empty for initial master setup check
});
type LoginFormValues = z.infer<typeof loginSchema>;

const setPasswordSchema = z.object({
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;


export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });
  
  const passwordForm = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setGlobalError(null);

    const result = await login(data);

    if (result.success) {
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      const redirectedFrom = searchParams.get('redirectedFrom') || '/admin';
      router.push(redirectedFrom);
      router.refresh();
    } else if (result.needsPasswordSetup) {
      setNeedsPasswordSetup(true);
      setGlobalError(null);
      loginForm.reset({ username: data.username, password: '' }); 
    } else {
      setGlobalError(result.error || 'An unexpected error occurred.');
    }
    setIsSubmitting(false);
  };

  const onPasswordSubmit = async (data: SetPasswordFormValues) => {
    setIsSubmitting(true);
    setGlobalError(null);

    const result = await setInitialMasterPassword(data.password);
    if(result.success) {
        toast({ title: 'Password Set Successfully', description: 'Welcome, Master Admin!' });
        router.push('/admin');
        router.refresh();
    } else {
        setGlobalError(result.error || 'An unexpected error occurred.');
    }
    setIsSubmitting(false);
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
          <CardTitle>{needsPasswordSetup ? 'Initial Admin Setup' : 'Admin Login'}</CardTitle>
          <CardDescription>{needsPasswordSetup ? 'Welcome! Please set a secure password for the master admin account.' : 'Enter your credentials to access the dashboard.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {globalError && (
            <div className="flex items-center gap-x-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive mb-6">
              <AlertTriangle className="h-4 w-4" />
              {globalError}
            </div>
          )}

          {needsPasswordSetup ? (
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="Min. 6 characters" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Set Password and Log In
                    </Button>
                </form>
            </Form>
          ) : (
            <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                    control={loginForm.control}
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
                    control={loginForm.control}
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
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Sign In
                </Button>
                </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
