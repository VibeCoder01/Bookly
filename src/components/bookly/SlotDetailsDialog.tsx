
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
import { Calendar, Clock, User, Bookmark } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const colorPalette = [
  'bg-chart-1/80',
  'bg-chart-2/80',
  'bg-chart-3/80',
  'bg-chart-4/80',
  'bg-chart-5/80',
];

const stringToHash = (str: string): number => {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};


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
              <div
                  className={cn(
                      'h-5 w-5 shrink-0 rounded-sm border-2 border-accent-foreground/30',
                      slot.isBooked && slot.title
                      ? colorPalette[stringToHash(slot.title) % colorPalette.length]
                      : 'bg-transparent'
                  )}
              />
              <span className="font-medium">
                  {slot.isBooked ? 'Booked' : 'Available'}
              </span>
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
