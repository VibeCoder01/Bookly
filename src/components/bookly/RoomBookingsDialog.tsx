
'use client';

import type { Booking } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, UserCircle, Mail, Printer } from 'lucide-react';

interface RoomBookingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roomName: string;
  date: string; // Formatted date string (e.g., PPP from date-fns)
  bookings: Booking[];
}

export function RoomBookingsDialog({ isOpen, onOpenChange, roomName, date, bookings }: RoomBookingsDialogProps) {
  
  const handlePrint = () => {
    onOpenChange(false);
    setTimeout(() => window.print(), 0);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl print-section">
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
                  <TableHead className="w-[120px]">Time Slot</TableHead>
                  <TableHead>Booking Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.time}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
                        <span className="flex items-center">
                          <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                          {booking.userName}
                        </span>
                        <span className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-2 h-4 w-4" />
                          {booking.userEmail}
                        </span>
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

        <div className="mt-4 flex justify-end space-x-2 pt-4 border-t no-print">
            <Button type="button" variant="secondary" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
