
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Booking } from '@/types';
import { updateBooking } from '@/lib/actions';
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
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface BookingEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  booking: Booking | null;
}

const formSchema = z.object({
  id: z.string(),
  title: z.string().min(3, { message: 'Title must be at least 3 characters long.' }).max(100, { message: 'Title must be 100 characters or less.' }),
  userName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  userEmail: z.string().email({ message: 'Please enter a valid email address.' }),
});

export function BookingEditDialog({ isOpen, onOpenChange, onSuccess, booking }: BookingEditDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      title: '',
      userName: '',
      userEmail: '',
    },
  });

  useEffect(() => {
    if (isOpen && booking) {
      form.reset({
        id: booking.id,
        title: booking.title,
        userName: booking.userName,
        userEmail: booking.userEmail,
      });
    }
  }, [isOpen, booking, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const result = await updateBooking(values);

    if (result.success) {
      toast({
        title: 'Booking Updated',
        description: 'The booking details have been successfully updated.',
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Updating Booking',
        description: result.error || 'An unexpected error occurred.',
      });
       if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof z.infer<typeof formSchema>, { type: 'manual', message: Array.isArray(message) ? message.join(', ') : String(message) });
        });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">
            Edit Booking
          </DialogTitle>
          <DialogDescription>
            Update the details for the booking "{booking?.title}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Kick-off Meeting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booked By Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="userEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booked By Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
