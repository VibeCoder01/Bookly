
'use client';

import type { Booking } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, UserCircle } from 'lucide-react';

interface RoomBookingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roomName: string;
  date: string; // Formatted date string (e.g., PPP from date-fns)
  bookings: Booking[];
}

export function RoomBookingsDialog({ isOpen, onOpenChange, roomName, date, bookings }: RoomBookingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">
            Bookings for {roomName}
          </DialogTitle>
          <DialogDescription className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
            On {date}
          </DialogDescription>
        </DialogHeader>
        
        {bookings.length > 0 ? (
          <ScrollArea className="max-h-[60vh] my-4 pr-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Time Slot</TableHead>
                  <TableHead>Booked By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.time}</TableCell>
                    <TableCell className="flex items-center">
                       <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                       {booking.userName}
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

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
