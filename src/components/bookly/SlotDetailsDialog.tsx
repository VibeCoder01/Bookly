
'use client';

import type { SlotStatus } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Bookmark, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface SlotDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  details: {
    date: string;
    slot: SlotStatus;
  } | null;
}

export function SlotDetailsDialog({ isOpen, onOpenChange, details }: SlotDetailsDialogProps) {
  if (!details) {
    return null;
  }

  const { date, slot } = details;
  const formattedDate = format(new Date(date + 'T00:00:00'), 'PPP');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Slot Details</DialogTitle>
          <DialogDescription>
            Information for the selected time slot.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
            </div>
            <div className="flex items-center gap-3">
                {slot.isBooked ? (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
                <Badge variant={slot.isBooked ? 'destructive' : 'secondary'} className="bg-opacity-80">
                    {slot.isBooked ? 'Booked' : 'Available'}
                </Badge>
            </div>
            {slot.isBooked && (
                <>
                    <hr className="my-2 border-border"/>
                    <div className="flex items-start gap-3">
                        <Bookmark className="mt-1 h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-sm text-muted-foreground">Booking Title</p>
                            <p className="font-medium break-words">{slot.title}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <User className="mt-1 h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-sm text-muted-foreground">Booked By</p>
                            <p className="font-medium break-words">{slot.userName}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
