
'use client';

import type { Room, TimeSlot, Booking, BookingFormData, AIResponse } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Clock, Building2, User, Mail, Loader2, AlertTriangle, Eye } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { getAvailableTimeSlots, submitBooking, getBookingsForRoomAndDate } from '@/lib/actions';
import { RoomBookingsDialog } from './RoomBookingsDialog';

interface BookingFormProps {
  rooms: Room[];
  onBookingAttemptCompleted: (booking: Booking | null, aiResponse?: AIResponse) => void;
}

const formSchema = z.object({
  roomId: z.string().min(1, 'Please select a room.'),
  date: z.date({ required_error: 'Please select a date.' }),
  time: z.string().min(1, 'Please select a time slot.'),
  userName: z.string().min(2, 'Name must be at least 2 characters.').max(50),
  userEmail: z.string().email('Please enter a valid email address.'),
});

type FormValues = z.infer<typeof formSchema>;

export function BookingForm({ rooms, onBookingAttemptCompleted }: BookingFormProps) {
  const { toast } = useToast();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [selectedDateForSlots, setSelectedDateForSlots] = useState<Date | undefined>();

  const [isBookingsDialogOpen, setIsBookingsDialogOpen] = useState(false);
  const [bookingsForSelectedRoomDate, setBookingsForSelectedRoomDate] = useState<Booking[]>([]);
  const [isLoadingRoomBookings, setIsLoadingRoomBookings] = useState(false);
  const [roomDetailsForDialog, setRoomDetailsForDialog] = useState<{ roomName: string; date: string } | null>(null);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomId: '',
      date: undefined,
      time: '',
      userName: '',
      userEmail: '',
    },
  });

  const selectedRoomId = form.watch('roomId');
  const selectedDate = form.watch('date');

  const fetchSlots = useCallback(async (roomId: string, date: Date | undefined) => {
    if (!roomId || !date) {
      setAvailableSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    setSelectedDateForSlots(date); 
    try {
      const result = await getAvailableTimeSlots(roomId, format(date, 'yyyy-MM-dd'));
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error fetching slots', description: result.error });
        setAvailableSlots([]);
      } else {
        setAvailableSlots(result.slots);
        const currentSelectedTime = form.getValues('time');
        if (currentSelectedTime && !result.slots.find(slot => slot.display === currentSelectedTime)) {
          form.setValue('time', '');
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch time slots.' });
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [toast, form]);

  useEffect(() => {
    if (selectedRoomId && selectedDate) {
      if (!selectedDateForSlots || format(selectedDate, 'yyyy-MM-dd') !== format(selectedDateForSlots, 'yyyy-MM-dd')) {
        fetchSlots(selectedRoomId, selectedDate);
      }
    } else {
      setAvailableSlots([]);
    }
  }, [selectedRoomId, selectedDate, fetchSlots, selectedDateForSlots]);


  async function onSubmit(data: FormValues) {
    setIsSubmittingForm(true);
    try {
      const submissionData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      };
      const result = await submitBooking(submissionData);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Booking Failed',
          description: result.error,
        });
        if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, errors]) => {
                form.setError(field as keyof FormValues, { type: 'server', message: errors.join(', ') });
            });
        }
        if (result.error.includes("slot was just booked") && selectedRoomId && selectedDate) {
           fetchSlots(selectedRoomId, selectedDate);
        }
        if(result.aiResponse || result.error) {
           onBookingAttemptCompleted(null, result.aiResponse);
        }

      } else if (result.booking) {
        toast({
          title: 'Booking Successful!',
          description: `Room ${result.booking.roomName} booked for ${result.booking.date} at ${result.booking.time}.`,
        });
        onBookingAttemptCompleted(result.booking, result.aiResponse);
        form.reset();
        setAvailableSlots([]);
        setSelectedDateForSlots(undefined);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An Unexpected Error Occurred',
        description: 'Please try again later.',
      });
      onBookingAttemptCompleted(null, undefined);
    } finally {
      setIsSubmittingForm(false);
    }
  }

  const handleShowRoomDetails = async () => {
    if (!selectedRoomId || !selectedDate) {
      toast({ variant: 'destructive', title: 'Selection Missing', description: 'Please select a room and a date first.' });
      return;
    }
    setIsLoadingRoomBookings(true);
    try {
      const result = await getBookingsForRoomAndDate(selectedRoomId, format(selectedDate, 'yyyy-MM-dd'));
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error Fetching Bookings', description: result.error });
        setBookingsForSelectedRoomDate([]);
      } else {
        setBookingsForSelectedRoomDate(result.bookings);
        setRoomDetailsForDialog({ roomName: result.roomName || 'Selected Room', date: format(selectedDate, 'PPP') });
        setIsBookingsDialogOpen(true);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch room booking details.' });
      setBookingsForSelectedRoomDate([]);
    } finally {
      setIsLoadingRoomBookings(false);
    }
  };

  const isDetailsButtonDisabled = !selectedRoomId || !selectedDate || isLoadingSlots || isLoadingRoomBookings || isSubmittingForm;

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="roomId" className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-primary" /> Room
            </Label>
            <Controller
              name="roomId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger id="roomId" aria-label="Select Room">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} (Capacity: {room.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.roomId && (
              <p className="text-sm text-destructive">{form.formState.errors.roomId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-primary" /> Date
            </Label>
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                          field.onChange(date);
                          form.setValue('time', ''); 
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {selectedRoomId && selectedDate && (
            <div className="space-y-2 flex-grow w-full sm:w-auto">
              <Label htmlFor="time" className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" /> Available Time Slots
              </Label>
              {isLoadingSlots ? (
                <div className="flex items-center space-x-2 text-muted-foreground h-10">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading time slots...</span>
                </div>
              ) : availableSlots.length > 0 ? (
                <Controller
                  name="time"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <SelectTrigger id="time" aria-label="Select Time Slot">
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot.display} value={slot.display}>
                            {slot.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <div className="flex items-center space-x-2 text-destructive-foreground bg-destructive/10 p-3 rounded-md border border-destructive h-10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span>No available slots for this room on the selected date.</span>
                </div>
              )}
              {form.formState.errors.time && (
                <p className="text-sm text-destructive">{form.formState.errors.time.message}</p>
              )}
            </div>
          )}
           <div className="w-full sm:w-auto flex-shrink-0">
             <Button 
                type="button" 
                variant="outline" 
                onClick={handleShowRoomDetails} 
                disabled={isDetailsButtonDisabled}
                className="w-full sm:w-auto"
              >
                {isLoadingRoomBookings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                View Bookings
              </Button>
            </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="userName" className="flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" /> Your Name
            </Label>
            <Input id="userName" placeholder="e.g. John Doe" {...form.register('userName')} />
            {form.formState.errors.userName && (
              <p className="text-sm text-destructive">{form.formState.errors.userName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="userEmail" className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary" /> Your Email
            </Label>
            <Input id="userEmail" type="email" placeholder="e.g. john.doe@example.com" {...form.register('userEmail')} />
            {form.formState.errors.userEmail && (
              <p className="text-sm text-destructive">{form.formState.errors.userEmail.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmittingForm || isLoadingSlots || isLoadingRoomBookings}>
          {isSubmittingForm ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            'Book Room'
          )}
        </Button>
      </form>
      {roomDetailsForDialog && (
        <RoomBookingsDialog
          isOpen={isBookingsDialogOpen}
          onOpenChange={setIsBookingsDialogOpen}
          roomName={roomDetailsForDialog.roomName}
          date={roomDetailsForDialog.date}
          bookings={bookingsForSelectedRoomDate}
        />
      )}
    </>
  );
}
