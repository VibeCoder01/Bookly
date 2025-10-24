
'use client';

import type { Booking } from '@/types';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, UserCircle, Mail, Trash2, Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteBooking } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { BookingEditDialog } from './BookingEditDialog';


interface RoomBookingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roomName: string;
  date: string; // Formatted date string (e.g., PPP from date-fns)
  bookings: Booking[];
  onDataModified: () => void;
  canDeleteBookings: boolean;
  requiresAuthForDeletion: boolean;
  canEditBookings: boolean;
  requiresAuthForEditing: boolean;
}

export function RoomBookingsDialog({
  isOpen,
  onOpenChange,
  roomName,
  date,
  bookings,
  onDataModified,
  canDeleteBookings,
  requiresAuthForDeletion,
  canEditBookings,
  requiresAuthForEditing,
}: RoomBookingsDialogProps) {
  const { toast } = useToast();
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    // Sync local state if the initial bookings prop changes, e.g., when dialog is re-opened for new data
    if (isOpen) {
        setLocalBookings(bookings);
    }
  }, [bookings, isOpen]);
  
  useEffect(() => {
    if (!canEditBookings && isEditDialogOpen) {
      setIsEditDialogOpen(false);
      setBookingToEdit(null);
    }
  }, [canEditBookings, isEditDialogOpen]);
  
  const showDeletionAuthNotice = requiresAuthForDeletion && !canDeleteBookings;
  const showEditAuthNotice = requiresAuthForEditing && !canEditBookings;
  const deleteButtonTitle = !canDeleteBookings
    ? requiresAuthForDeletion
      ? 'Log in to delete bookings'
      : 'You do not have permission to delete bookings'
    : undefined;
  const editButtonTitle = !canEditBookings
    ? requiresAuthForEditing
      ? 'Log in to edit bookings'
      : 'You do not have permission to edit bookings'
    : undefined;
  
  const handleDelete = async () => {
    if (!bookingToDelete) return;
    if (!canDeleteBookings) {
      setBookingToDelete(null);
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: requiresAuthForDeletion
          ? 'Please sign in to delete bookings.'
          : 'You do not have permission to delete bookings.',
      });
      return;
    }

    setIsDeleting(true);
    const result = await deleteBooking(bookingToDelete.id);

    if (result.success) {
        toast({ title: 'Booking Deleted', description: `The booking for "${bookingToDelete.title}" has been deleted.` });
        setLocalBookings(prev => prev.filter(b => b.id !== bookingToDelete.id));
        onDataModified();
    } else {
        toast({ variant: 'destructive', title: 'Error Deleting Booking', description: result.error });
    }

    setIsDeleting(false);
    setBookingToDelete(null);
  };

  const handleEditClick = (booking: Booking) => {
    if (!canEditBookings) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: requiresAuthForEditing
          ? 'Please sign in to edit bookings.'
          : 'You do not have permission to edit bookings.',
      });
      return;
    }
    setBookingToEdit(booking);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    onDataModified();
  };

  const effectiveEditDialogOpen = canEditBookings && isEditDialogOpen;

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!canEditBookings) {
      setIsEditDialogOpen(false);
      setBookingToEdit(null);
      return;
    }
    setIsEditDialogOpen(open);
    if (!open) {
      setBookingToEdit(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-primary">
              Bookings for {roomName}
            </DialogTitle>
            <DialogDescription className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
              On {date}
            </DialogDescription>
          </DialogHeader>
          
          {localBookings.length > 0 ? (
            <ScrollArea className="max-h-[60vh] my-4 pr-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Time Slot</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Booked By</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.time}</TableCell>
                      <TableCell>{booking.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1 text-sm">
                          <span className="flex items-center">
                            <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                            {booking.userName}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground pl-6">
                            {booking.userEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(booking)}
                              disabled={isDeleting || !canEditBookings}
                              title={editButtonTitle}
                            >
                                <Pencil className="h-4 w-4 text-primary" />
                                <span className="sr-only">Edit booking</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => canDeleteBookings && setBookingToDelete(booking)}
                                disabled={isDeleting || !canDeleteBookings}
                                title={deleteButtonTitle}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete booking</span>
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="my-8 text-center text-muted-foreground">
              <p>No bookings found for this room on {date}.</p>
            </div>
          )}

          {(showDeletionAuthNotice || showEditAuthNotice) && (
            <div className="my-4 space-y-1 text-sm text-muted-foreground">
              {showDeletionAuthNotice && <div>Log in to delete bookings.</div>}
              {showEditAuthNotice && <div>Log in to edit bookings.</div>}
            </div>
          )}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={canDeleteBookings && !!bookingToDelete} onOpenChange={(isOpen) => !isOpen && setBookingToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the booking "{bookingToDelete?.title}" for {bookingToDelete?.time}. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBookingToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))} disabled={isDeleting || !canDeleteBookings}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BookingEditDialog 
        isOpen={effectiveEditDialogOpen}
        onOpenChange={handleEditDialogOpenChange}
        onSuccess={handleEditSuccess}
        booking={bookingToEdit}
      />
    </>
  );
}
