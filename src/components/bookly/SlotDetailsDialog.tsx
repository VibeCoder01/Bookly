
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


interface SlotDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  details: {
    date: string;
    slot: SlotStatus;
    colorClass?: string;
  } | null;
  showStrike?: boolean;
  panelBorderClass?: string;
}

export function SlotDetailsDialog({ isOpen, onOpenChange, details, showStrike, panelBorderClass }: SlotDetailsDialogProps) {
  if (!details) {
    return null;
  }

  const { date, slot, colorClass } = details;
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
                      'h-5 w-5 shrink-0 rounded-sm border-2 relative',
                      panelBorderClass || 'border-accent-foreground/30',
                      colorClass || 'bg-transparent'
                  )}
              >
                {showStrike && slot.isBooked && slot.title && (
                    <div
                        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='0' x2='100%25' y2='100%25' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3e%3c/svg%3e")`
                        }}
                    />
                )}
              </div>
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
