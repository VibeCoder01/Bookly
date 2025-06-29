'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { User, UserFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {addUserByAdmin, updateUserByAdmin} from '@/lib/actions'

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  user: User | null;
}

const formSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, { message: 'Username must be at least 3 characters long.' }),
  password: z.string().optional(),
  permissions: z.object({
      canManageRooms: z.boolean().default(false),
      canManageConfig: z.boolean().default(false),
      canManageData: z.boolean().default(false),
  }),
}).refine(data => {
    // If it's a new user (no ID), password is required.
    if (!data.id && (!data.password || data.password.length < 6)) {
        return false;
    }
    // If it's an existing user and password is provided, it must be valid.
    if (data.id && data.password && data.password.length < 6) {
        return false;
    }
    return true;
}, {
    message: 'New users require a password of at least 6 characters. If updating, password must also be at least 6 characters.',
    path: ['password'],
});

type UserFormValues = z.infer<typeof formSchema>;

export function UserFormDialog({ isOpen, onOpenChange, onSuccess, user }: UserFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      username: '',
      password: '',
      permissions: {
        canManageRooms: false,
        canManageConfig: false,
        canManageData: false,
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(); // Clear previous state and errors
        if (user) {
            form.reset({
                id: user.id,
                username: user.username,
                password: '', // Password field is empty for editing for security
                permissions: user.permissions
            });
        } else {
             form.reset({
                id: undefined,
                username: '',
                password: '',
                permissions: { canManageRooms: true, canManageConfig: false, canManageData: false }
            });
        }
    }
  }, [isOpen, user, form]);

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
        const action = isEditing ? updateUserByAdmin : addUserByAdmin;
        const result = await action(values as UserFormData);

        if (result?.success) {
          toast({
            title: `Admin User ${isEditing ? 'Updated' : 'Added'}`,
            description: `The user "${values.username}" has been successfully ${isEditing ? 'updated' : 'added'}.`,
          });
          onSuccess();
          onOpenChange(false);
        } else {
          toast({
            variant: 'destructive',
            title: `Error ${isEditing ? 'Updating' : 'Adding'} User`,
            description: result?.error || 'An unexpected error occurred.',
          });
        }
    } catch (error) {
        console.error("User form submission error:", error);
        toast({
            variant: 'destructive',
            title: 'Operation Failed',
            description: 'An unexpected server error occurred. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">
            {isEditing ? 'Edit Admin User' : 'Add New Admin User'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for "${user?.username}".` : 'Create a new admin with specific permissions.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., room_manager" {...field} />
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
                            <Input type="password" placeholder={isEditing ? 'Leave blank to keep unchanged' : 'Min. 6 characters'} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div>
                <h4 className="mb-2 font-medium text-sm">Permissions</h4>
                <div className="space-y-4 rounded-lg border p-4">
                    <FormField
                        control={form.control}
                        name="permissions.canManageRooms"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                                <div>
                                    <FormLabel>Manage Rooms</FormLabel>
                                    <p className="text-xs text-muted-foreground">Can add, edit, and delete rooms.</p>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="permissions.canManageConfig"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                                <div>
                                    <FormLabel>Manage Configuration</FormLabel>
                                    <p className="text-xs text-muted-foreground">Can change slot duration and work hours.</p>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="permissions.canManageData"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                                <div>
                                    <FormLabel>Manage Data</FormLabel>
                                    <p className="text-xs text-muted-foreground">Can import and export all application data.</p>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
                  Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Admin'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
