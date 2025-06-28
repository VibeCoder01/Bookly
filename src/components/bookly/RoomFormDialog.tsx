
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Room, RoomFormData } from '@/types';
import { addRoom, updateRoom } from '@/lib/actions';
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

interface RoomFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void; // To trigger a refresh on the parent component
  room: Room | null;
}

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Room name must be at least 3 characters long.' }),
  capacity: z.coerce.number().int().positive({ message: 'Capacity must be a positive whole number.' }),
});

export function RoomFormDialog({ isOpen, onOpenChange, onSuccess, room }: RoomFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
      capacity: 1,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (room) {
        form.reset({
          id: room.id,
          name: room.name,
          capacity: room.capacity,
        });
      } else {
        form.reset({
          id: undefined,
          name: '',
          capacity: 1,
        });
      }
    }
  }, [isOpen, room, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const action = room ? updateRoom : addRoom;
    const result = await action(values as RoomFormData);

    if (result.success) {
      toast({
        title: `Room ${room ? 'Updated' : 'Added'}`,
        description: `The room "${values.name}" has been successfully ${room ? 'updated' : 'added'}.`,
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: `Error ${room ? 'Updating' : 'Adding'} Room`,
        description: result.error || 'An unexpected error occurred.',
      });
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof RoomFormData, { type: 'manual', message: Array.isArray(message) ? message.join(', ') : String(message) });
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
            {room ? 'Edit Room' : 'Add New Room'}
          </DialogTitle>
          <DialogDescription>
            {room ? `Update the details for "${room.name}".` : 'Enter the details for the new room.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Conference Room Omega" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="e.g., 8" {...field} />
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
                {room ? 'Save Changes' : 'Add Room'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
